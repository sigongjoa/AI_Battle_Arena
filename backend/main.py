# main.py
import sys
import os
import asyncio # Added

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import routes as api_routes
from .grpc_server import start_grpc_server # Added gRPC server import

app = FastAPI()

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # 프론트엔드 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AI Battle Arena Backend is running."}

# API 라우터 등록 (추후 활성화)
app.include_router(api_routes.router, prefix="/api")

# --- gRPC Server Integration ---
@app.on_event("startup")
async def startup_event():
    print("Starting gRPC server...")
    asyncio.create_task(start_grpc_server()) # Start gRPC server as a background task

# WebSocket 엔드포인트 등록 (추후 활성화) - Removed
# app.add_api_websocket_route("/ws/game/{match_id}", websocket_handlers.game_endpoint)
# app.add_api_websocket_route("/ws/training/{session_id}", websocket_handlers.training_endpoint)
