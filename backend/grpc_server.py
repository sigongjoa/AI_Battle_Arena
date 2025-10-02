import asyncio
from concurrent import futures
import os
import logging
import grpc

os.environ['GRPC_VERBOSITY'] = 'DEBUG'

logging.basicConfig()
grpc_logger = logging.getLogger('grpc')
grpc_logger.setLevel(logging.DEBUG)

from backend.proto_gen import game_pb2, game_pb2_grpc


# =========================
# GameService Implementation
# =========================
class GameService(game_pb2_grpc.GameServiceServicer):
    def __init__(self):
        # 임시 상태 저장소
        self.players = {
            "P1": {"x": 100, "y": 500, "health": 100, "status": "idle"},
            "P2": {"x": 600, "y": 500, "health": 100, "status": "idle"},
        }

    # 클라이언트 → 서버 : 입력 처리 (Unary RPC)
    async def SendPlayerInput(self, request, context):
        player_id = request.player_id
        action = request.action
        # timestamp = request.timestamp # proto에 timestamp 필드가 없으므로 주석 처리

        print(f"[Input] {player_id} -> {action}")

        # 간단히 액션을 상태에 반영
        if player_id in self.players:
            self.players[player_id]["status"] = action

        return game_pb2.Ack(success=True, message=f"Input {action} received")

    # 서버 → 클라이언트 : 게임 상태 스트리밍
    async def StreamGameState(self, request, context):
        match_id = request.match_id
        frame = 0

        # 무한 스트리밍 (게임 루프 흉내)
        while True:
            frame += 1

            state = game_pb2.GameState(
                match_id=match_id,
                timer=99 - (frame // 60),
                players=[
                    game_pb2.PlayerState(
                        player_id="1",
                        character="RYU",
                        x=10 + frame,
                        y=0,
                        action="idle",
                        frame=frame,
                        health=100,
                        status="normal",
                        super_gauge=0
                    ),
                    game_pb2.PlayerState(
                        player_id="2",
                        character="KEN",
                        x=200 - frame,
                        y=0,
                        action="idle",
                        frame=frame,
                        health=100,
                        status="normal",
                        super_gauge=0
                    ),
                ]
            )

            print(f"▶ Sending frame {frame}")  # 디버깅용 로그
            yield state
            await asyncio.sleep(0.016)  # ~60 FPS


# =========================
# gRPC Server Runner
# =========================
async def serve(port: int):
    server = grpc.aio.server()
    game_pb2_grpc.add_GameServiceServicer_to_server(GameService(), server)

    listen_addr = f"[::]:{port}"
    server.add_insecure_port(listen_addr)
    print(f"🚀 gRPC server started on {listen_addr}")
    await server.start()
    await server.wait_for_termination()


async def start_grpc_server(port: int):
    await serve(port)

async def serve(port: int):
    server = grpc.aio.server()
    game_pb2_grpc.add_GameServiceServicer_to_server(GameService(), server)

    listen_addr = f"[::]:{port}"
    server.add_insecure_port(listen_addr)
    print(f"🚀 gRPC server started on {listen_addr}")
    await server.start()
    await server.wait_for_termination()