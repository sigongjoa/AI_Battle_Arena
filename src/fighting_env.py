import gymnasium as gym
from gymnasium import spaces # Ensure spaces is imported
import numpy as np
import queue
import threading
import logging
from typing import Tuple # Import Tuple

from src.networking.webrtc import WebRTCClient
from src.rhythm_analyzer import RhythmAnalyzer
from src.rl_training.rewards import RewardCalculator # Import RewardCalculator

# Basic logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FightingEnv(gym.Env):
    """
    A Gymnasium environment that communicates with a browser-based game
    client via WebRTC. The reward calculation is now handled on the backend.
    """

    metadata = {"render_modes": ["human"], "render_fps": 60}

    def __init__(self, backend_peer_id: str, render_mode=None, test_mode: bool = False, headless_mode: bool = False):
        super().__init__()
        self.test_mode = test_mode
        self.headless_mode = headless_mode
        self.prev_state = {}

        # Action Space: Tuple of two discrete actions (one for each player)
        # Each action: 0:Idle, 1:MoveFwd, 2:MoveBwd, 3:Jump, 4:Attack1, 5:Attack2
        self.action_space = gym.spaces.Tuple((spaces.Discrete(6), spaces.Discrete(6)))

        # Observation: [p1_x, p1_y, p1_hp, p1_state, p2_x, p2_y, p2_hp, p2_state]
        # Rhythm analysis features are removed for now to simplify the refactoring.
        self.observation_space = gym.spaces.Box(
            low=0.0, high=1.0, shape=(8,), dtype=np.float32
        )

        self.action_queue = queue.Queue()
        self.result_queue = queue.Queue()

        if self.headless_mode or self.test_mode:
            # Use a mock client for headless or test mode
            # MockGameClient starts its own thread, so no need to create one
            from src.networking.mock_client import MockGameClient
            self.game_client = MockGameClient(self.action_queue, self.result_queue)
            self.game_client_thread = None  # MockGameClient manages its own thread
            if self.test_mode:
                logger.info("FightingEnv running in test mode with MockGameClient.")
            else:
                logger.info("FightingEnv running in headless mode with MockGameClient.")
        else:
            # Use WebRTC client for normal mode
            self.game_client = WebRTCClient(
                self.action_queue, self.result_queue, test_mode=self.test_mode
            )
            self.game_client_thread = threading.Thread(
                target=self.game_client.run,
                args=(backend_peer_id,),
                daemon=True,
            )
            self.game_client_thread.start()
            logger.info("FightingEnv running in normal mode with WebRTCClient.")

        # Instantiate RewardCalculator
        self.reward_calculator = RewardCalculator() # Using default values for now

    def wait_for_connection(self):
        """
        Waits for the 'connection_ready' message from the frontend.
        """
        logger.info("Waiting for frontend connection...")
        try:
            result = self.result_queue.get(timeout=60)
            if result.get("type") == "connection_ready":
                logger.info("Frontend connection established successfully.")
            else:
                raise ConnectionError(
                    "Received unexpected message while waiting for connection."
                )
        except queue.Empty:
            logger.error("Timeout: Frontend did not connect within 60 seconds.")
            raise ConnectionAbortedError("Frontend connection timed out.")

    def step(self, action: Tuple[int, int]):
        p1_action, p2_action = action
        self.action_queue.put({"type": "action", "p1Action": int(p1_action), "p2Action": int(p2_action)})
        try:
            result = self.result_queue.get(timeout=10)

            if result.get("type") != "action_result":
                raise ConnectionError("Unexpected message type received for step.")

            # The result now contains raw state data
            current_state = result["state"]
            obs = np.array(current_state["observation"], dtype=np.float32)
            terminated = current_state["round_over"]
            truncated = False
            info = {}

            # Prepare data for RewardCalculator
            player_state = {
                "health": current_state["p1_health"],
                "x": current_state["p1_pos_x"],
            }
            opponent_state = {
                "health": current_state["p2_health"],
                "x": current_state["p2_pos_x"],
            }
            game_info = {
                "round_over": current_state["round_over"],
                "player_won": current_state["p1_health"] > current_state["p2_health"], # Assuming p1 is the agent
            }
            last_player_health = self.prev_state.get("p1_health", current_state["p1_health"])
            last_opponent_health = self.prev_state.get("p2_health", current_state["p2_health"])
            last_distance = abs(self.prev_state.get("p1_pos_x", 0) - self.prev_state.get("p2_pos_x", 0))

            # Calculate reward using RewardCalculator
            reward = self.reward_calculator.calculate_reward(
                player_state, opponent_state, game_info, p1_action,
                last_player_health, last_opponent_health, last_distance
            )

            # Update previous state
            self.prev_state = current_state

            return obs, reward, terminated, truncated, info

        except queue.Empty:
            logger.error("Timeout: Did not receive action_result from frontend in time.", exc_info=True)
            # Return default observation but distinguish timeout from actual game over
            return (
                np.zeros(self.observation_space.shape, dtype=np.float32),
                0.0,
                True,  # terminated=True to stop the episode
                False,
                {"timeout": True, "error": "step_timeout"},  # Explicit timeout indicator
            )

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self.action_queue.put({"type": "reset"})
        try:
            # First, check for connection_ready message if it hasn't been consumed yet
            # This is a handshake that MockGameClient sends upon startup
            result = self.result_queue.get(timeout=10)
            if result.get("type") == "connection_ready":
                # If connection_ready, then get the actual reset_result
                result = self.result_queue.get(timeout=10)

            if result.get("type") != "reset_result":
                raise ConnectionError("Unexpected message type received for reset.")

            # Store the initial state
            initial_state = result["state"]
            self.prev_state = initial_state

            obs = np.array(initial_state["observation"], dtype=np.float32)

            # Prepare info dict with game state information
            info = {
                'player_1_state': {
                    'health': initial_state.get("p1_health", 1.0),
                    'position': [initial_state.get("p1_pos_x", 0.2), initial_state.get("p1_pos_y", 0.0)]
                },
                'player_2_state': {
                    'health': initial_state.get("p2_health", 1.0),
                    'position': [initial_state.get("p2_pos_x", 0.8), initial_state.get("p2_pos_y", 0.0)]
                },
                'round_over': initial_state.get("round_over", False)
            }

            return obs, info

        except queue.Empty:
            logger.error("Timeout: Did not receive reset_result from frontend in time.", exc_info=True)
            self.prev_state = {}
            return np.zeros(self.observation_space.shape, dtype=np.float32), {
                "timeout": True,
                "error": "reset_timeout"
            }

    def render(self):
        """
        Rendering is handled by the browser (frontend). This method is a no-op.
        """
        logger.info("Rendering is handled by the browser frontend.")
        pass

    def close(self):
        """
        Closes the game client connection and cleans up resources.
        """
        if self.game_client is not None:
            if hasattr(self.game_client, 'stop'):
                self.game_client.stop()
            if self.game_client_thread and self.game_client_thread.is_alive():
                self.game_client_thread.join(timeout=2)


