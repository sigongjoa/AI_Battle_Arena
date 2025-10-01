import asyncio
import os
from stable_baselines3 import PPO
from src.fighting_env import FightingEnv
from src.constants import FPS
from .. import game_pb2

# Define MODEL_DIR
MODEL_DIR = "./models/ppo_fighting_env_multi_agent"

class GameRunner:
    """
    Manages and runs a single Pygame game instance, streaming its state via gRPC.
    """
    def __init__(self, match_id: str, player1_id: int, player2_id: int):
        self.match_id = match_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        self._running = False
        self.env = FightingEnv(headless=True)
        self.obs = self.env.reset() # Store initial observation
        
        model_path = os.path.join(MODEL_DIR, "ppo_centralized_final.zip")
        if os.path.exists(model_path):
            self.model = PPO.load(model_path, env=self.env)
            print(f"Loaded PPO model from {model_path}")
        else:
            self.model = None
            print(f"Warning: Model not found at {model_path}. AI will not be used.")

    async def run_grpc_stream(self):
        """
        Runs the game loop and yields GameState protobuf messages for streaming.
        """
        self._running = True
        print(f"Starting game loop for match {self.match_id} (P1:{self.player1_id} vs P2:{self.player2_id})")
        
        tick_rate = 1.0 / FPS

        while self._running:
            loop_start_time = asyncio.get_event_loop().time()

            actions = (0, 0) # Default to no action
            if self.model:
                # Use the observation stored from the previous step
                actions_array, _ = self.model.predict(self.obs, deterministic=True)
                actions = tuple(actions_array)

            # Perform a step and get the new observation
            next_obs, reward, done, info = self.env.step(actions)
            self.obs = next_obs # Update the observation for the next iteration

            p1 = self.env.game.player1
            p2 = self.env.game.player2

            # Perform a step and get the new observation
            next_obs, reward, done, info = self.env.step(actions)
            self.obs = next_obs # Update the observation for the next iteration
            
            current_frame = (self.env.game.frame_count // 6) % 4

            p1_state_pb = game_pb2.PlayerState(
                id=self.player1_id,
                character="RYU",
                x=p1.rect.centerx,
                y=p1.rect.centery,
                action=p1.state,
                frame=current_frame,
                health=p1.health,
                super_gauge=0, # Placeholder
            )
            p2_state_pb = game_pb2.PlayerState(
                id=self.player2_id,
                character="KEN",
                x=p2.rect.centerx,
                y=p2.rect.centery,
                action=p2.state,
                frame=current_frame,
                health=p2.health,
                super_gauge=0, # Placeholder
            )

            game_state_pb = game_pb2.GameState(
                match_id=self.match_id,
                timer=self.env.game.round_timer,
                players=[p1_state_pb, p2_state_pb]
            )

            if done:
                self._running = False
                winner_id = 0 # Draw by default
                if p1.health <= 0:
                    winner_id = self.player2_id
                elif p2.health <= 0:
                    winner_id = self.player1_id
                else: # Timer ran out
                    if p1.health > p2.health:
                        winner_id = self.player1_id
                    elif p2.health > p1.health:
                        winner_id = self.player2_id
                
                game_state_pb.winner_id = winner_id

            yield game_state_pb

            if done:
                break

            elapsed_time = asyncio.get_event_loop().time() - loop_start_time
            await asyncio.sleep(max(0, tick_rate - elapsed_time))

        print(f"Game loop for match {self.match_id} finished.")

    def stop(self):
        """
        Stops the game loop.
        """
        self._running = False
