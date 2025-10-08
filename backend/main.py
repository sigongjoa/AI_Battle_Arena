# main.py
import json
import os
import sys

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.api import routes as api_routes

app = FastAPI()

# Dictionary to store active WebSocket connections
connected_peers: dict[str, WebSocket] = {}

# CORS (Cross-Origin Resource Sharing) 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],  # Explicitly allow the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 포함
app.include_router(api_routes.router, prefix="/api")
print("API router included with prefix /api")


@app.websocket("/ws/{peer_id}")
async def websocket_endpoint(websocket: WebSocket, peer_id: str):
    # Manually check the origin for WebSocket connections
    origin = websocket.headers.get("origin")
    if origin is not None and origin != "http://localhost:5174":
        await websocket.close(code=1008)  # Policy Violation
        print(f"[Signaling] DENIED: Unauthorized origin: {origin}")
        return

    await websocket.accept()
    connected_peers[peer_id] = websocket
    print(f"[Signaling] Peer connected: {peer_id} (Total: {len(connected_peers)})")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Simple relay logic
            destination_peer_id = message.get("dst")
            if destination_peer_id and destination_peer_id in connected_peers:
                # Add source peer_id to the message for reply
                message["src"] = peer_id
                await connected_peers[destination_peer_id].send_text(
                    json.dumps(message)
                )
            else:
                print(f"[Signaling] Destination peer {destination_peer_id} not found.")

    except WebSocketDisconnect:
        if peer_id in connected_peers:
            del connected_peers[peer_id]
        print(
            f"[Signaling] Peer disconnected: {peer_id} (Total: {len(connected_peers)})\n"
        )
    except Exception as e:
        print(f"[Signaling] Error for peer {peer_id}: {e}")
        if peer_id in connected_peers:
            del connected_peers[peer_id]


@app.get("/")
def read_root():
    return {"message": "AI Battle Arena Backend"}


if __name__ == "__main__":
    print("Starting FastAPI server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
