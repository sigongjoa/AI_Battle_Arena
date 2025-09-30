import asyncio
import os
# from fastapi import WebSocket # Removed

from stable_baselines3 import PPO
from src.fighting_env import FightingEnv
from src.constants import FPS
from ..api.dto import GameStateDTO, PlayerStateDTO # Still needed for internal mapping
from backend.proto_gen.game_pb2 import GameState, PlayerState # Added for gRPC protobuf messages

# Define MODEL_DIR (or import from train_rl_agent if it's a shared constant)
# For now, define it here for self-containment.
MODEL_DIR = "./models/ppo_fighting_env_multi_agent"

class GameRunner:
    """
    단일 Pygame 게임 인스턴스를 관리하고 실행합니다.
    """
    def __init__(self, match_id: str, player1_id: int, player2_id: int): # Removed websocket
        # self.websocket = websocket # Removed
        self.match_id = match_id # Stored match_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        self._running = False
        self.env = FightingEnv(headless=True)
        self.env.reset()
        
        # Load the trained PPO model
        model_path = os.path.join(MODEL_DIR, "ppo_centralized_final.zip")
        self.model = PPO.load(model_path, env=self.env)
        print(f"Loaded PPO model from {model_path}")

    async def run_grpc_stream(self): # Renamed and adapted for gRPC streaming
        """
        게임 루프를 실행하고 GameState protobuf 메시지를 yield합니다.
        """
        self._running = True
        print(f"Starting real game loop for match {self.match_id} (P1:{self.player1_id} vs P2:{self.player2_id})")
        
        round_timer = 99
        tick_rate = 1.0 / FPS

        while self._running:
            loop_start_time = asyncio.get_event_loop().time()

            # 1. Choose actions using the loaded PPO model
            obs = self.env.get_obs() # Get current observation
            actions_array, _states = self.model.predict(obs, deterministic=True)
            actions = tuple(actions_array[0]) # Unpack for MultiDiscrete (n_envs=1)

            # 2. Step the environment
            obs, reward, done, info = self.env.step(actions)

            # 3. Get player objects for detailed state
            p1 = self.env.game.player1
            p2 = self.env.game.player2

            # 4. Map to Protobuf GameState
            p1_state_pb = PlayerState(
                health=p1.health,
                super_gauge=0, # TODO: Implement super_gauge in Player class
                position_x=p1.rect.centerx,
                position_y=p1.rect.centery,
                current_action=p1.state
            )
            p2_state_pb = PlayerState(
                health=p2.health,
                super_gauge=0, # TODO: Implement super_gauge in Player class
                position_x=p2.rect.centerx,
                position_y=p2.rect.centery,
                current_action=p2.state
            )
            game_state_pb = GameState(
                match_id=self.match_id,
                timer=round_timer,
                player1=p1_state_pb,
                player2=p2_state_pb,
                winner_id=None # Default to None, set if done
            )

            # 5. Check for game over
            if done:
                self._running = False
                if p1.health <= 0:
                    game_state_pb.winner_id = self.player2_id
                elif p2.health <= 0:
                    game_state_pb.winner_id = self.player1_id
                else: # Timer ran out
                    if p1.health > p2.health:
                        game_state_pb.winner_id = self.player1_id
                    elif p2.health > p1.health:
                        game_state_pb.winner_id = self.player2_id
                    else:
                        game_state_pb.winner_id = 0 # Draw

            # 6. Yield state to gRPC server
            yield game_state_pb

            if done:
                break

            # 7. Maintain FPS
            elapsed_time = asyncio.get_event_loop().time() - loop_start_time
            await asyncio.sleep(max(0, tick_rate - elapsed_time))
            
            # This is a simplified timer, a more robust one would use `dt`
            if round_timer > 0:
                round_timer -= 1 # Decrement roughly once per second if FPS is ~60

        print("Real game loop finished.")

    def stop(self):
        """
        게임 루프를 중지합니다.
        """
        self._running = False
