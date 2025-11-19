"""
This module provides a WebRTC client for Python using aiortc.
It connects to the custom FastAPI WebSocket signaling server to exchange
SDP and ICE candidates with a browser client.
"""

import asyncio
import functools
import json
import logging
import queue

import aiohttp
import numpy as np
from aiortc import RTCDataChannel, RTCPeerConnection, RTCSessionDescription

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SIGNALING_URL = "ws://localhost:8001/ws/"


class WebRTCClient:
    def __init__(
        self,
        action_queue: queue.Queue,
        result_queue: queue.Queue,
        test_mode: bool = False,
    ):
        self.test_mode = test_mode
        self.action_queue = action_queue
        self.result_queue = result_queue
        self.loop = None
        self.pc = RTCPeerConnection()
        self.data_channel: RTCDataChannel | None = None
        self.backend_peer_id = None
        self.frontend_peer_id = None

    def run(self, peer_id: str, signaling_server_url: str = "ws://localhost:8001/ws"):
        self.peer_id = peer_id
        if self.test_mode:
            logger.info(
                f"WebRTCClient running in test mode for peer_id: {peer_id}. Simulating connection_ready."
            )
            self.result_queue.put({"type": "connection_ready"})

            # Loop to simulate responses for reset and step
            while True:
                try:
                    # Use a short timeout to allow the thread to be interrupted or for tests to finish
                    message = self.action_queue.get(timeout=1)
                    if message.get("type") == "close":
                        logger.info("Test mode: Received close signal.")
                        break
                    if message["type"] == "reset":
                        logger.info(
                            "Test mode: Received reset, sending dummy reset_result."
                        )
                        dummy_obs = np.zeros(
                            8, dtype=np.float32
                        )  # Assuming 8-dim observation space
                        self.result_queue.put(
                            {"type": "reset_result", "observation": dummy_obs.tolist()}
                        )
                    elif message["type"] == "action":
                        logger.info(
                            f"Test mode: Received action {message['action']}, sending dummy step_result."
                        )
                        dummy_obs = np.zeros(8, dtype=np.float32)
                        dummy_reward = 0.0
                        dummy_done = False
                        self.result_queue.put(
                            {
                                "type": "step_result",
                                "observation": dummy_obs.tolist(),
                                "reward": dummy_reward,
                                "done": dummy_done,
                            }
                        )
                except queue.Empty:
                    pass
                except Exception as e:
                    logger.error(f"Test mode: Error processing action_queue: {e}")
                    break
            return

        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

        try:
            self.loop.create_task(self.connect())
            self.loop.run_forever()
        finally:
            logger.info("Shutting down WebRTC client event loop.")
            tasks = asyncio.all_tasks(loop=self.loop)
            for t in tasks:
                t.cancel()
            self.loop.run_until_complete(asyncio.gather(*tasks, return_exceptions=True))
            self.loop.run_until_complete(self.pc.close())
            self.loop.close()

    async def connect(self):
        @self.pc.on("datachannel")
        def on_datachannel(channel: RTCDataChannel):
            logger.info(f"Data channel '{channel.label}' created by remote.")
            self.data_channel = channel
            self._setup_channel_events()

        session = aiohttp.ClientSession()
        ws_url = f"{SIGNALING_URL}{self.peer_id}"

        try:
            async with session.ws_connect(ws_url) as ws:
                logger.info(f"Connected to custom signaling server at {ws_url}")

                # Wait for an offer from the frontend
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        await self.handle_signaling(ws, json.loads(msg.data))
                    elif msg.type == aiohttp.WSMsgType.ERROR:
                        break
        except Exception as e:
            logger.error(f"Signaling connection failed: {e}")
        finally:
            await session.close()

    async def handle_signaling(self, ws, message):
        msg_type = message.get("type")
        if msg_type == "offer":
            self.frontend_peer_id = message.get("src")
            logger.info(f"Received OFFER from frontend peer: {self.frontend_peer_id}")

            offer = RTCSessionDescription(
                sdp=message["payload"]["sdp"], type=message["payload"]["type"]
            )
            await self.pc.setRemoteDescription(offer)

            answer = await self.pc.createAnswer()
            await self.pc.setLocalDescription(answer)

            payload = {
                "type": "answer",
                "dst": self.frontend_peer_id,
                "payload": {
                    "type": self.pc.localDescription.type,
                    "sdp": self.pc.localDescription.sdp,
                },
            }
            await ws.send_str(json.dumps(payload))
            logger.info("Sent ANSWER to frontend peer.")

    def _setup_channel_events(self):
        if not self.data_channel:
            return

        @self.data_channel.on("message")
        def on_message(message):
            try:
                data = json.loads(message)
                logger.info(f"Received message from frontend: {data}")
                self.result_queue.put(data)
            except Exception as e:
                logger.warning(f"Failed to process message: {e}")

        @self.data_channel.on("open")
        def on_open():
            logger.info("Data channel 'on(open)' event fired.")
            # The action sender is now started from here OR from the readyState check below
            if self.loop and not self.loop.is_closed():
                self.loop.create_task(self._action_sender())

        # Check the state immediately in case the 'open' event was missed (race condition)
        if self.data_channel.readyState == "open":
            logger.info(
                "Data channel already open. Starting action sender immediately."
            )
            if self.loop and not self.loop.is_closed():
                self.loop.create_task(self._action_sender())

    async def _action_sender(self):
        while self.data_channel and self.data_channel.readyState == "open":
            try:
                action = self.action_queue.get_nowait()  # Non-blocking get

                if action.get("type") == "close":
                    break
                logger.info(f"Sending action to frontend: {action}")
                self.data_channel.send(json.dumps(action))
            except queue.Empty:
                # If the queue is empty, don't just spin. Wait a little.
                await asyncio.sleep(0.01)
                continue
            except Exception as e:
                logger.error(f"Error in action sender: {e}")
                break

    def close(self):
        if self.loop and self.loop.is_running():
            self.loop.stop()
