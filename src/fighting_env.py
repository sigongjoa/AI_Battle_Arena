import gymnasium as gym
from gymnasium import spaces # Ensure spaces is imported
import numpy as np
import queue
import threading
import logging
from typing import Tuple # Import Tuple

from src.webrtc_client import WebRTCClient
from src.rhythm_analyzer import RhythmAnalyzer
from src.reward_calculator import RewardCalculator # Import RewardCalculator

# Basic logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FightingEnv(gym.Env):
    """
    A Gymnasium environment that communicates with a browser-based game
    client via WebRTC. The reward calculation is now handled on the backend.
    """

    metadata = {"render_modes": ["human"], "render_fps": 60}

    def __init__(self, backend_peer_id: str, render_mode=None, test_mode: bool = False):
        super().__init__()
        self.test_mode = test_mode
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

        self.webrtc_client = WebRTCClient(
            self.action_queue, self.result_queue, test_mode=self.test_mode
        )

        # Run the WebRTC client in a separate thread
        self.webrtc_thread = threading.Thread(
            target=self.webrtc_client.run,
            args=(backend_peer_id,),
            daemon=True,
        )
        self.webrtc_thread.start()

        self._wait_for_connection()

        # Instantiate RewardCalculator
        self.reward_calculator = RewardCalculator() # Using default values for now

    def _wait_for_connection(self):
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
            logger.error("Timeout: Did not receive action_result from frontend in time.")
            return (
                np.zeros(self.observation_space.shape, dtype=np.float32),
                0,
                True,
                False,
                {"timeout": True},
            )

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self.action_queue.put({"type": "reset"})
        try:
            result = self.result_queue.get(timeout=10)

            if result.get("type") != "reset_result":
                raise ConnectionError("Unexpected message type received for reset.")

            # Store the initial state
            initial_state = result["state"]
            self.prev_state = initial_state
            
            obs = np.array(initial_state["observation"], dtype=np.float32)
            info = {}

            return obs, info

        except queue.Empty:
            logger.error("Timeout: Did not receive reset_result from frontend in time.")
            self.prev_state = {}
            return np.zeros(self.observation_space.shape, dtype=np.float32), {
                "timeout": True
            }

    def render(self):
        """
        Rendering is handled by the browser (frontend). This method is a no-op.
        """
        logger.info("Rendering is handled by the browser frontend.")
        pass

    def close(self):
        """
        Closes the WebRTC connection and cleans up resources.
        """
        # Send a close signal to the action queue to unblock the sender loop
        self.action_queue.put({"type": "close"})

        if self.webrtc_thread and self.webrtc_thread.is_alive():
            if (
                self.webrtc_client
                and self.webrtc_client.loop
                and self.webrtc_client.loop.is_running()
            ):
                self.webrtc_client.loop.call_soon_threadsafe(self.webrtc_client.close)
            self.webrtc_thread.join(timeout=5)

        logger.info("FightingEnv closed.")
