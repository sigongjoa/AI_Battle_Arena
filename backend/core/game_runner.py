import asyncio
import os
from typing import Tuple
import numpy as np
from stable_baselines3 import PPO

from src.constants import FPS
from src.fighting_env import FightingEnv
from src.rhythm_analyzer import RhythmAnalyzer

# Define MODEL_DIR
MODEL_DIR = "./models/ppo_fighting_env_multi_agent"


class GameRunner:
    """
    Manages and runs a single Pygame game instance.
    (gRPC streaming functionality removed as per user instruction)
    """

    def __init__(self, match_id: str, player1_id: str, player2_id: str, backend_peer_id: str):
        self.match_id = match_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        self._running = False
        self.env = FightingEnv(backend_peer_id=backend_peer_id, test_mode=True)
        self.obs, _ = self.env.reset()  # Store initial observation

        # Initialize RhythmAnalyzers for both players
        self.player1_analyzer = RhythmAnalyzer(window_size=50, fps=FPS)
        self.player2_analyzer = RhythmAnalyzer(window_size=50, fps=FPS)

        # Player action states
        self.player1_moving = 0  # 0 = not moving, -1 = left, 1 = right
        self.player2_moving = 0

        model_path = os.path.join(MODEL_DIR, "ppo_centralized_final.zip")
        if os.path.exists(model_path):
            self.model = PPO.load(model_path, env=self.env)
            print(f"Loaded PPO model from {model_path}")
        else:
            self.model = None
            print(f"Warning: Model not found at {model_path}. AI will not be used.")

    async def handle_player_input(self, player_id: str, key: str, key_action: int):
        """
        Handles player input received.
        key_action: 0 for PRESS, 1 for RELEASE
        """
        player = None
        is_player1 = False
        if player_id == self.player1_id:
            player = self.env.game.player1
            is_player1 = True
        elif player_id == self.player2_id:
            player = self.env.game.player2
        else:
            return  # Input is not for any player in this match

        key_press = key_action == 0  # PRESS

        # --- Player 1 Controls ---
        if is_player1:
            if key == "a":
                self.player1_moving = -1 if key_press else 0
            elif key == "d":
                self.player1_moving = 1 if key_press else 0
            elif key == "w" and key_press:
                player.jump()
            elif key == "s":
                player.is_guarding = key_press
            elif key == " " and key_press:  # Space bar for attack
                player.attack()
        # --- Player 2 Controls ---
        else:
            if key == "ArrowLeft":
                self.player2_moving = -1 if key_press else 0
            elif key == "ArrowRight":
                self.player2_moving = 1 if key_press else 0
            elif key == "ArrowUp" and key_press:
                player.jump()
            elif key == "ArrowDown":
                player.is_guarding = key_press
            elif key == "Enter" and key_press:
                player.attack()

        # Apply movement based on state
        if is_player1 and self.player1_moving != 0:
            player.move(self.player1_moving)
        elif not is_player1 and self.player2_moving != 0:
            player.move(self.player2_moving)

    async def run_grpc_stream(self):
        """
        Runs the game loop. (gRPC streaming functionality removed).
        """
        self._running = True
        print(
            f"Starting game loop for match {self.match_id} (P1:{self.player1_id} vs P2:{self.player2_id})"
        )

        tick_rate = 1.0 / FPS

        while self._running:
            loop_start_time = asyncio.get_event_loop().time()

            # --- Enrich observation with Rhythm Analysis ---
            p1_rhythm_vec = self.player1_analyzer.get_feature_vector()
            p2_rhythm_vec = self.player2_analyzer.get_feature_vector()
            enriched_obs = np.concatenate([self.obs, p1_rhythm_vec, p2_rhythm_vec])

            # --- Get AI actions (if model is loaded) ---
            ai_actions = (0, 0)
            if self.model:
                # Use the enriched observation for prediction
                actions_array, _ = self.model.predict(enriched_obs, deterministic=True)
                ai_actions = tuple(actions_array)

            # --- Step the environment ---
            next_obs, reward, done, _, info = self.env.step(ai_actions)
            self.obs = next_obs  # Update base observation for the next frame

            # --- Update Rhythm Analyzers with the actions taken ---
            # (Assuming ai_actions contains the actions for player1 and player2)
            # We need a mapping from action ID to action name, this should be in constants
            ACTION_MAP = {
                0: "IDLE",
                1: "MOVE",
                2: "MOVE",
                3: "JUMP",
                4: "PUNCH",
                5: "KICK",
            }  # Example map
            p1_action_name = ACTION_MAP.get(ai_actions[0], "UNKNOWN")
            p2_action_name = ACTION_MAP.get(ai_actions[1], "UNKNOWN")
            self.player1_analyzer.add_action(p1_action_name, self.env.game.frame_count)
            self.player2_analyzer.add_action(p2_action_name, self.env.game.frame_count)

            # Game state would have been streamed here via gRPC
            # For now, just print a message
            # print(f"Game state for match {self.match_id} at frame {self.env.game.frame_count} would be streamed.")

            if done:
                self._running = False
                winner_id = "0"  # Draw by default
                p1 = self.env.game.player1
                p2 = self.env.game.player2
                if p1.health <= 0:
                    winner_id = self.player2_id
                elif p2.health <= 0:
                    winner_id = self.player1_id
                else:  # Timer ran out
                    if p1.health > p2.health:
                        winner_id = self.player1_id
                    elif p2.health > p1.health:
                        winner_id = self.player2_id
                print(f"Match {self.match_id} ended. Winner: {winner_id}")

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
