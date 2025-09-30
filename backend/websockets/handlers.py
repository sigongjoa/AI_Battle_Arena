# websockets/handlers.py
from fastapi import WebSocket, WebSocketDisconnect

import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from ..core.game_runner import GameRunner

async def game_endpoint(websocket: WebSocket, match_id: str):
    """
    실시간 대전 WebSocket 엔드포인트
    """
    await websocket.accept()
    print(f"[Game] WebSocket connection established for match: {match_id}")
    game_runner = None
    game_task = None

    try:
        while True:
            # 클라이언트로부터 메시지 수신 (예: 'start_match')
            data = await websocket.receive_json()
            print(f"[Game] Received from client: {data}")
            
            if data.get('action') == 'start_match':
                player1_id = data.get('player1_id')
                player2_id = data.get('player2_id')

                if player1_id is None or player2_id is None:
                    await websocket.send_json({"error": "Player IDs are required"})
                    continue

                print(f"Starting match for P1:{player1_id} vs P2:{player2_id}")
                game_runner = GameRunner(websocket, player1_id, player2_id)
                game_task = asyncio.create_task(game_runner.run())
                await websocket.send_json({"status": "match_started", "match_id": match_id})
            else:
                await websocket.send_json({"error": "Invalid action"})

    except WebSocketDisconnect:
        print(f"[Game] WebSocket connection closed for match: {match_id}")
        if game_runner:
            game_runner.stop()
        if game_task:
            game_task.cancel()
    except Exception as e:
        print(f"[Game] Error in WebSocket for match {match_id}: {e}")
        if game_runner:
            game_runner.stop()
        if game_task:
            game_task.cancel()

from ..core.training_manager import TrainingManager

async def training_endpoint(websocket: WebSocket, session_id: str):
    """
    실시간 학습 현황 WebSocket 엔드포인트
    """
    await websocket.accept()
    print(f"[Training] WebSocket connection established for session: {session_id}")
    training_manager = TrainingManager(websocket, session_id)
    training_task = asyncio.create_task(training_manager.start_training())

    try:
        # Keep the connection alive to receive potential messages from client (e.g., stop)
        while True:
            await websocket.receive_text() 

    except WebSocketDisconnect:
        print(f"[Training] WebSocket connection closed for session: {session_id}")
        training_manager.stop_training()
        training_task.cancel()
    except Exception as e:
        print(f"[Training] Error in WebSocket for session {session_id}: {e}")
        training_manager.stop_training()
        training_task.cancel()
