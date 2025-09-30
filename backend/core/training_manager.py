import asyncio
import functools
# from fastapi import WebSocket # Removed

from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv

from src.fighting_env import FightingEnv
# from .ws_callback import WebSocketCallback # Removed
from backend.proto_gen.training_pb2 import TrainingMetrics # Added for gRPC protobuf messages
from .grpc_callback import GrpcTrainingCallback # Added

class TrainingManager:
    """
    강화학습 세션을 관리합니다.
    """
    def __init__(self, session_id: str): # Removed websocket
        # self.websocket = websocket # Removed
        self.session_id = session_id
        self._training = False
        self.model = None
        self.metrics_queue = asyncio.Queue() # Added for gRPC streaming
        self.grpc_callback = None # Renamed from ws_callback

        def _run_learning_blocking(self, grpc_callback): # Renamed ws_callback to grpc_callback
            """
            This function is designed to be run in an executor.
            It contains the blocking `model.learn()` call.
            """
            print("Starting model.learn() in executor thread...")
            try:
                self.model.learn(total_timesteps=100000, callback=grpc_callback) # Pass grpc_callback
                print("model.learn() finished.")
            except Exception as e:
                print(f"An error occurred during training: {e}")
        async def run_grpc_stream(self): # Renamed start_training to run_grpc_stream
            """
            학습을 시작하고 TrainingMetrics protobuf 메시지를 yield합니다.
            """
            self._training = True
            print(f"Initializing training for session: {self.session_id}")
    
            loop = asyncio.get_running_loop()
    
            # 1. Create Environment
            env = FightingEnv(headless=True)
            vec_env = DummyVecEnv([lambda: env])
    
            # 2. Create Callback (gRPC compatible)
            # This callback will put metrics into self.metrics_queue
            self.grpc_callback = GrpcTrainingCallback(metrics_queue=self.metrics_queue, loop=loop, session_id=self.session_id) # New callback, stored as grpc_callback
            
            # 3. Create Model
            self.model = PPO("MlpPolicy", vec_env, verbose=0)
    
            # Start the blocking `learn` method in a separate thread
            learn_task = loop.run_in_executor(
                None,
                self._run_learning_blocking,
                self.grpc_callback # Pass stored grpc_callback
            )    
            # Yield metrics from the queue as they become available
            try:
                while self._training or not self.metrics_queue.empty():
                    try:
                        metrics_pb = await asyncio.wait_for(self.metrics_queue.get(), timeout=1.0)
                        yield metrics_pb
                    except asyncio.TimeoutError:
                        # If no metrics for a while, check if training is still active
                        if not self._training and self.metrics_queue.empty():
                            break # Exit if training stopped and queue is empty
                    except asyncio.CancelledError:
                        break # Exit if stream is cancelled
            finally:
                # Ensure the learn task is cancelled if the stream ends prematurely
                if not learn_task.done():
                    learn_task.cancel()
                await asyncio.gather(learn_task, return_exceptions=True) # Wait for it to finish cancelling
    
            print(f"Training task for session {self.session_id} has completed.")
    def stop_training(self):
        """
        Stops the training loop.
        """
        print("Attempting to stop training...")
        if self.grpc_callback:
            self.grpc_callback.stop() # Signal the callback to stop training
