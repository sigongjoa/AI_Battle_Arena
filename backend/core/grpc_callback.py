import asyncio
from typing import Dict
from stable_baselines3.common.callbacks import BaseCallback

from backend.proto_gen import training_pb2

class GrpcTrainingCallback(BaseCallback):
    """
    A custom callback to put RL training metrics into an asyncio Queue for gRPC streaming.
    """
    def __init__(self, metrics_queue: asyncio.Queue, loop: asyncio.AbstractEventLoop, session_id: str, verbose: int = 0):
        super().__init__(verbose)
        self.metrics_queue = metrics_queue
        self.loop = loop
        self.session_id = session_id
        self.episode_reward = 0
        self.episode_length = 0
        self.stop_training_flag = False

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
            return False # Stop training

        # Log episodic info when an episode ends
        if self.locals["dones"][0]:
            info = self.locals["infos"][0]
            if "episode" in info.keys():
                self.episode_reward = info["episode"]["r"]
                self.episode_length = info["episode"]["l"]

        # Put data into the queue every N steps (e.g., every 100 steps)
        if self.n_calls % 100 == 0:
            latest_log = self.model.logger.get_latest_values()
            loss = latest_log.get("train/loss", 0)
            vf_loss = latest_log.get("train/vf_loss", 0) # Proxy for Q-value

            metrics_pb = training_pb2.TrainingMetrics(
                session_id=self.session_id,
                step=self.num_timesteps,
                episode=self.n_calls // 2048, # Approximate episode
                loss=loss,
                reward=self.episode_reward,
                q_value=vf_loss,
                episode_length=self.episode_length
            )
            
            # Put the protobuf message into the queue in a thread-safe way
            # Use call_soon_threadsafe to schedule a coroutine in the main loop
            self.loop.call_soon_threadsafe(self.metrics_queue.put_nowait, metrics_pb)

        return True
