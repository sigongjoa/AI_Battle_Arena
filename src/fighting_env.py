import gymnasium as gym
import numpy as np
import queue
import threading
import logging
import asyncio

from src.webrtc_client import WebRTCClient

# Basic logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FightingEnv(gym.Env):
    """
    A Gymnasium environment that communicates with a browser-based game
    client via WebRTC.
    """
    metadata = {"render_modes": ["human"], "render_fps": 60}

    def __init__(self, backend_peer_id: str, render_mode=None, test_mode: bool = False):
        super().__init__()
        self.test_mode = test_mode

        # Define action and observation spaces based on the spec
        # Action: 0:Idle, 1:MoveFwd, 2:MoveBwd, 3:Jump, 4:Attack1, 5:Attack2
        self.action_space = gym.spaces.Discrete(6)

        # Observation: [p1_x, p1_y, p1_hp, p1_state, p2_x, p2_y, p2_hp, p2_state]
        # For simplicity, we assume 8 features now. This should match the frontend.
        self.observation_space = gym.spaces.Box(
            low=0.0, high=1.0, shape=(8,), dtype=np.float32
        )

        self.action_queue = queue.Queue()
        self.result_queue = queue.Queue()

        self.webrtc_client = WebRTCClient(self.action_queue, self.result_queue, test_mode=self.test_mode)
        
        # Run the WebRTC client in a separate thread
        self.webrtc_thread = threading.Thread(
            target=self.webrtc_client.run,
            args=(backend_peer_id,),
            daemon=True  # Daemon threads exit when the main program exits
        )
        self.webrtc_thread.start()

        self._wait_for_connection()

    def _wait_for_connection(self):
        """
        Waits for the 'connection_ready' message from the frontend.
        """
        logger.info("Waiting for frontend connection...")
        try:
            # Wait for 60 seconds for the connection to be ready
            result = self.result_queue.get(timeout=60)
            if result.get("type") == "connection_ready":
                logger.info("Frontend connection established successfully.")
            else:
                raise ConnectionError("Received unexpected message while waiting for connection.")
        except queue.Empty:
            logger.error("Timeout: Frontend did not connect within 60 seconds.")
            raise ConnectionAbortedError("Frontend connection timed out.")

    def step(self, action):
        logger.info("Putting 'action' on action queue.")
        self.action_queue.put({"type": "action", "action": int(action)})
        try:
            result = self.result_queue.get(timeout=10) # 10-second timeout for step
            
            if result.get("type") != "step_result":
                raise ConnectionError("Unexpected message type received for step.")

            obs = np.array(result["observation"], dtype=np.float32)
            reward = result["reward"]
            terminated = result["done"]
            truncated = False # Not used in this environment
            info = {}

            return obs, reward, terminated, truncated, info

        except queue.Empty:
            logger.error("Timeout: Did not receive step_result from frontend in time.")
            # On timeout, we treat it as a terminal condition
            return np.zeros(self.observation_space.shape, dtype=np.float32), 0, True, False, {"timeout": True}

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        
        logger.info("Putting 'reset' on action queue.")
        self.action_queue.put({"type": "reset"})
        try:
            result = self.result_queue.get(timeout=10) # 10-second timeout for reset

            if result.get("type") != "reset_result":
                raise ConnectionError("Unexpected message type received for reset.")

            obs = np.array(result["observation"], dtype=np.float32)
            info = {}
            
            return obs, info

        except queue.Empty:
            logger.error("Timeout: Did not receive reset_result from frontend in time.")
            return np.zeros(self.observation_space.shape, dtype=np.float32), {"timeout": True}

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
            if self.webrtc_client and self.webrtc_client.loop and self.webrtc_client.loop.is_running():
                self.webrtc_client.loop.call_soon_threadsafe(self.webrtc_client.close)
            self.webrtc_thread.join(timeout=5)
        
        logger.info("FightingEnv closed.")