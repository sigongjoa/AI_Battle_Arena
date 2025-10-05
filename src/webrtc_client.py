import asyncio
import json
import logging
import queue
import threading

from peerpy.peer import Peer
from peerpy.connection import Connection

# Basic logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants for PeerJS Server
PEERJS_HOST = 'localhost'
PEERJS_PORT = 9000
PEERJS_PATH = '/myapp'

class WebRTCClient:
    """
    Manages the WebRTC connection using the peerpy library.
    """

    def __init__(self, action_queue: queue.Queue, result_queue: queue.Queue):
        self.action_queue = action_queue
        self.result_queue = result_queue
        self.loop = None
        self.peer: Peer | None = None
        self.data_channel: Connection | None = None

    def run(self, backend_peer_id: str):
        """
        Entry point for the thread. Sets up and runs the asyncio event loop.
        """
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        try:
            self.loop.run_until_complete(self.connect(backend_peer_id))
        except KeyboardInterrupt:
            pass
        finally:
            logger.info("Shutting down WebRTC client...")
            # Ensure final cleanup happens within the loop
            if self.loop.is_running():
                self.loop.run_until_complete(self._shutdown())
            self.loop.close()

    def close(self):
        """Schedules the shutdown of the WebRTC client from another thread."""
        if self.loop:
            self.loop.call_soon_threadsafe(
                lambda: asyncio.ensure_future(self._shutdown())
            )

    async def _shutdown(self):
        """Coroutine that handles the actual cleanup and stopping of the loop."""
        if self.peer and not self.peer.destroyed:
            await self.peer.destroy()
        
        # Stop the asyncio event loop
        if self.loop and self.loop.is_running():
            self.loop.stop()

    async def connect(self, backend_peer_id: str):
        """
        Connects to the PeerJS server using peerpy and waits for a connection.
        """
        self.peer = Peer(backend_peer_id, host=PEERJS_HOST, port=PEERJS_PORT, path=PEERJS_PATH)

        @self.peer.on('open')
        async def on_open(peer_id):
            logger.info(f"PeerJS connection open. Registered with ID: {peer_id}")

        @self.peer.on('connection')
        async def on_connection(conn):
            logger.info(f"Data connection received from: {conn.peer}")
            self.data_channel = conn
            self._setup_channel_events()

        @self.peer.on('error')
        async def on_error(err):
            logger.error(f"A PeerJS error occurred: {err}")
            self.result_queue.put({"type": "error", "payload": str(err)})

        # This will connect to the PeerJS server and keep the connection alive
        await self.peer.start()
        
        # Keep the coroutine alive to handle events
        while self.peer and not self.peer.destroyed:
            await asyncio.sleep(1)

    def _setup_channel_events(self):
        """Sets up the event listeners for the data channel."""
        if not self.data_channel:
            return

        @self.data_channel.on('data')
        async def on_data(data):
            try:
                message = json.loads(data)
                self.result_queue.put(message)
            except (json.JSONDecodeError, TypeError):
                 logger.warning(f"Received non-JSON or unexpected data: {data}")

        @self.data_channel.on('open')
        async def on_open():
            logger.info("Data channel is open and ready for communication.")
            # Start the action sender task now that the channel is open
            asyncio.create_task(self._action_sender())

    async def _action_sender(self):
        """
        Continuously checks the action_queue for actions to send to the frontend.
        """
        while True:
            try:
                action_to_send = await self.loop.run_in_executor(
                    None, self.action_queue.get
                )
                if self.data_channel and not self.data_channel.closed:
                    payload = json.dumps(action_to_send)
                    await self.data_channel.send(payload)
                else:
                    logger.warning("Data channel not open or has closed, stopping sender.")
                    break # Exit loop if channel is closed
            except Exception as e:
                logger.error(f"Error in action sender: {e}")
                break
            await asyncio.sleep(0.01)