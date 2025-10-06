# backend/core/ws_callback.py
import asyncio
from typing import Any

from fastapi import WebSocket
from stable_baselines3.common.callbacks import BaseCallback

from ..api.dto import TrainingMetricsDTO


class WebSocketCallback(BaseCallback):
    """
    A custom callback to send RL training metrics over a WebSocket.
    """

    def __init__(
        self,
        websocket: WebSocket,
        loop: asyncio.AbstractEventLoop,
        session_id: str,
        verbose: int = 0,
    ):
        super().__init__(verbose)
        self.websocket = websocket
        self.loop = loop
        self.session_id = session_id
        self.episode_reward = 0
        self.episode_length = 0
        self.stop_training_flag = False  # Added flag

    def stop(self):
        """
        Sets the flag to stop training.
        """
        self.stop_training_flag = True

    def _on_step(self) -> bool:
        """
        This method is called after each call to `env.step()`.
        """
        if self.stop_training_flag:
            print("Stop training flag set. Stopping training.")
            return False  # Stop training

        # Log episodic info when an episode ends
        if self.locals["dones"][0]:
            info = self.locals["infos"][0]
            if "episode" in info.keys():
                self.episode_reward = info["episode"]["r"]
                self.episode_length = info["episode"]["l"]

        # Send data every N steps (e.g., every 100 steps)
        if self.n_calls % 100 == 0:
            latest_log = self.model.logger.get_latest_values()
            loss = latest_log.get("train/loss", 0)
            vf_loss = latest_log.get("train/vf_loss", 0)  # Proxy for Q-value

            metrics = TrainingMetricsDTO(
                session_id=self.session_id,  # Use stored session_id
                step=self.num_timesteps,
                episode=self.n_calls // 2048,  # Approximate episode
                loss=loss,
                reward=self.episode_reward,
                q_value=vf_loss,
                episode_length=self.episode_length,
            )

            # Send data to the WebSocket in a thread-safe way
            future = asyncio.run_coroutine_threadsafe(
                self.websocket.send_json(metrics.dict()), self.loop
            )

            try:
                future.result(timeout=1)  # Wait for the send to complete
            except Exception as e:
                print(f"Error sending WebSocket message: {e}")
                # If sending fails, maybe the connection is closed, so stop training
                return False

        return True
