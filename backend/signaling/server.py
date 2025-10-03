import asyncio
import json
import websockets
import logging
import uuid
import traceback
from enum import Enum

logging.basicConfig(level=logging.INFO)

class PlayerStatus(Enum):
    AVAILABLE = "available"
    IN_MATCH = "in_match"

class MatchStatus(Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    FAILED = "failed"

# In-memory data stores
PLAYERS = {}  # { "playerId": { "ws": websocket, "name": "playerName", "status": PlayerStatus.AVAILABLE } }
MATCH_SESSIONS = {} # { "sessionId": { "player1Id": string, "player2Id": string, "status": MatchStatus } }

async def send_to_player(player_id, message):
    """Sends a JSON message to a specific player."""
    if player_id in PLAYERS:
        ws = PLAYERS[player_id]["ws"]
        try:
            await ws.send(json.dumps(message))
        except websockets.exceptions.ConnectionClosed:
            logging.warning(f"Could not send to {player_id}, connection closed.")
    else:
        logging.warning(f"Attempted to send to non-existent player {player_id}")

async def broadcast_lobby_update():
    """Broadcasts the current lobby status to all available players."""
    lobby_players = [
        {"playerId": pid, "playerName": pinfo["name"], "status": pinfo["status"].value}
        for pid, pinfo in PLAYERS.items()
    ]
    message = {"type": "lobby_update", "players": lobby_players}
    # Create a list of tasks to send updates in parallel
    tasks = [send_to_player(pid, message) for pid, pinfo in PLAYERS.items()]
    await asyncio.gather(*tasks)

async def handle_join_lobby(player_id, data):
    """Handles a player joining the lobby."""
    player_name = data.get("playerName", "Anonymous")
    PLAYERS[player_id]["name"] = player_name
    PLAYERS[player_id]["status"] = PlayerStatus.AVAILABLE
    logging.info(f"Player {player_id} ({player_name}) joined the lobby.")
    await broadcast_lobby_update()

async def handle_request_match(player_id, data):
    """Handles a player requesting a match with another player."""
    target_id = data.get("targetId")
    if not target_id or target_id not in PLAYERS:
        await send_to_player(player_id, {"type": "error", "message": "Target player not found."})
        return

    if PLAYERS[target_id]["status"] != PlayerStatus.AVAILABLE:
        await send_to_player(player_id, {"type": "error", "message": "Target player is not available."})
        return

    session_id = str(uuid.uuid4())
    MATCH_SESSIONS[session_id] = {
        "player1Id": player_id,
        "player2Id": target_id,
        "status": MatchStatus.REQUESTED,
    }
    
    requester_name = PLAYERS[player_id]["name"]
    await send_to_player(target_id, {
        "type": "match_request_received",
        "requesterId": player_id,
        "requesterName": requester_name,
        "sessionId": session_id,
    })
    logging.info(f"Match request from {player_id} to {target_id} with session ID {session_id}.")

async def handle_accept_match(player_id, data):
    """Handles a player accepting a match request."""
    session_id = data.get("sessionId")
    if not session_id or session_id not in MATCH_SESSIONS:
        await send_to_player(player_id, {"type": "error", "message": "Match session not found."})
        return

    session = MATCH_SESSIONS[session_id]
    if player_id != session["player2Id"] or session["status"] != MatchStatus.REQUESTED:
        await send_to_player(player_id, {"type": "error", "message": "Invalid action."})
        return

    session["status"] = MatchStatus.ACCEPTED
    
    accepter_name = PLAYERS[player_id]["name"]
    await send_to_player(session["player1Id"], {
        "type": "match_request_accepted",
        "accepterName": accepter_name,
        "sessionId": session_id,
    })
    logging.info(f"Match {session_id} accepted by {player_id}.")
    
    # Set both players as in-match
    PLAYERS[session["player1Id"]]["status"] = PlayerStatus.IN_MATCH
    PLAYERS[session["player2Id"]]["status"] = PlayerStatus.IN_MATCH
    await broadcast_lobby_update()


async def handle_decline_match(player_id, data):
    """Handles a player declining a match request."""
    session_id = data.get("sessionId")
    if not session_id or session_id not in MATCH_SESSIONS:
        return # Fail silently

    session = MATCH_SESSIONS[session_id]
    if player_id != session["player2Id"]:
        return

    session["status"] = MatchStatus.DECLINED
    
    decliner_name = PLAYERS[player_id]["name"]
    await send_to_player(session["player1Id"], {
        "type": "match_request_declined",
        "declinerName": decliner_name,
        "sessionId": session_id,
    })
    logging.info(f"Match {session_id} declined by {player_id}.")
    del MATCH_SESSIONS[session_id]

async def handle_send_peer_id(player_id, data):
    """Relays PeerJS ID to the target player."""
    target_id = data.get("targetId")
    peer_id = data.get("peerId")
    if not target_id or not peer_id or target_id not in PLAYERS:
        logging.warning(f"Relay PeerJS ID failed: Target {target_id} not found or peerId missing.")
        return

    await send_to_player(target_id, {"type": "peerId", "senderId": player_id, "peerId": peer_id})
    logging.info(f"Relayed PeerJS ID {peer_id} from {player_id} to {target_id}")


async def relay_webrtc_message(player_id, data):
    """Relays WebRTC signaling messages (SDP, ICE) to the target player."""
    target_id = data.get("targetId")
    if not target_id or target_id not in PLAYERS:
        logging.warning(f"Relay failed: Target {target_id} not found.")
        return

    # Add senderId for context on the receiving client
    data["senderId"] = player_id
    await send_to_player(target_id, data)
    logging.info(f"Relayed {data['type']} from {player_id} to {target_id}")


async def handler(websocket):
    """Main WebSocket connection handler."""
    player_id = None
    try:
        # First message must be a registration
        registration_message = await websocket.recv()
        data = json.loads(registration_message)
        if data.get("type") == "register" and data.get("playerId"):
            player_id = data["playerId"]
            PLAYERS[player_id] = {"ws": websocket, "name": "Anonymous", "status": PlayerStatus.AVAILABLE}
            logging.info(f"Player {player_id} registered.")
            await send_to_player(player_id, {"type": "registered", "playerId": player_id})
        else:
            logging.warning("Invalid registration message.")
            await websocket.close()
            return

        # After registration, handle other messages
        async for message in websocket:
            data = json.loads(message)
            message_type = data.get("type")

            if message_type == "join_lobby":
                await handle_join_lobby(player_id, data)
            elif message_type == "request_match":
                await handle_request_match(player_id, data)
            elif message_type == "accept_match":
                await handle_accept_match(player_id, data)
            elif message_type == "decline_match":
                await handle_decline_match(player_id, data)
            elif message_type == "send_peer_id": # New handler for PeerJS ID exchange
                await handle_send_peer_id(player_id, data)
            elif message_type == "signal":
                await relay_webrtc_message(player_id, data)
            else:
                logging.warning(f"Unknown message type: {message_type} from {player_id}")

    except websockets.exceptions.ConnectionClosed:
        logging.info(f"Player {player_id} disconnected.")
    except Exception as e:
        logging.error(f"Error for player {player_id}: {e}", exc_info=True)
    finally:
        if player_id and player_id in PLAYERS:
            logging.info(f"Player {player_id} unregistered and sessions cleaned. Stack trace:")
            traceback.print_stack()
            del PLAYERS[player_id]
            # Clean up any stale match requests
            stale_sessions = [
                sid for sid, sess in MATCH_SESSIONS.items() 
                if sess["player1Id"] == player_id or sess["player2Id"] == player_id
            ]
            for sid in stale_sessions:
                del MATCH_SESSIONS[sid]
            await broadcast_lobby_update()

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        logging.info("Signaling server started on ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())