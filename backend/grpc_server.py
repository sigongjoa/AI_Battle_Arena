import grpc
import asyncio
from concurrent import futures
import time

# Import generated gRPC code
from .game_pb2 import GameState, PlayerState, GameStateRequest
from .game_pb2_grpc import GameServiceServicer, add_GameServiceServicer_to_server

from .training_pb2 import TrainingMetrics, TrainingMetricsRequest
from .training_pb2_grpc import TrainingServiceServicer, add_TrainingServiceServicer_to_server

# Import core logic components
from backend.core.game_runner import GameRunner
from backend.core.training_manager import TrainingManager

# --- Game Service Implementation ---
class GameServicer(GameServiceServicer):
    def __init__(self):
        self.game_runners = {} # Store active GameRunner instances by match_id

    async def StreamGameState(self, request: GameStateRequest, context):
        match_id = request.match_id
        player1_id = request.player1_id
        player2_id = request.player2_id

        print(f"gRPC: StreamGameState requested for match {match_id} (P1:{player1_id} vs P2:{player2_id})")

        # Create a new GameRunner instance for this match
        # Note: GameRunner currently expects a WebSocket, this needs refactoring.
        # For now, we'll adapt it to yield GameState protobuf messages.
        game_runner = GameRunner(match_id=match_id, player1_id=player1_id, player2_id=player2_id)
        self.game_runners[match_id] = game_runner

        try:
            # Adapt GameRunner to yield protobuf messages
            async for game_state_pb in game_runner.run_grpc_stream(): # This method needs to be added to GameRunner
                yield game_state_pb
        except asyncio.CancelledError:
            print(f"gRPC: StreamGameState for match {match_id} cancelled.")
        except Exception as e:
            print(f"gRPC: Error in StreamGameState for match {match_id}: {e}")
        finally:
            if match_id in self.game_runners:
                del self.game_runners[match_id]
            game_runner.stop()
            print(f"gRPC: StreamGameState for match {match_id} finished.")

# --- Training Service Implementation ---
class TrainingServicer(TrainingServiceServicer):
    def __init__(self):
        self.training_managers = {} # Store active TrainingManager instances by session_id

    async def StreamTrainingMetrics(self, request: TrainingMetricsRequest, context):
        session_id = request.session_id
        print(f"gRPC: StreamTrainingMetrics requested for session {session_id}")

        # Create a new TrainingManager instance for this session
        # Note: TrainingManager currently expects a WebSocket, this needs refactoring.
        # For now, we'll adapt it to yield TrainingMetrics protobuf messages.
        training_manager = TrainingManager(session_id=session_id)
        self.training_managers[session_id] = training_manager

        try:
            # Adapt TrainingManager to yield protobuf messages
            async for training_metrics_pb in training_manager.run_grpc_stream(): # This method needs to be added to TrainingManager
                yield training_metrics_pb
        except asyncio.CancelledError:
            print(f"gRPC: StreamTrainingMetrics for session {session_id} cancelled.")
        except Exception as e:
            print(f"gRPC: Error in StreamTrainingMetrics for session {session_id}: {e}")
        finally:
            if session_id in self.training_managers:
                del self.training_managers[session_id]
            training_manager.stop_training()
            print(f"gRPC: StreamTrainingMetrics for session {session_id} finished.")

# --- gRPC Server Startup ---
async def start_grpc_server(port: int = 50051):
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    add_GameServiceServicer_to_server(GameServicer(), server)
    add_TrainingServiceServicer_to_server(TrainingServicer(), server)
    server.add_insecure_port(f'[::]:{port}')
    print(f"gRPC Server listening on port {port}")
    await server.start()
    await server.wait_for_termination()

if __name__ == '__main__':
    # For standalone testing
    async def main():
        await start_grpc_server()
    asyncio.run(main())
