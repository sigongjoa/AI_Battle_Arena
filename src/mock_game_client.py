import queue
import time
import numpy as np
import logging

logger = logging.getLogger(__name__)

class MockGameClient:
    def __init__(self, action_queue: queue.Queue, result_queue: queue.Queue):
        self.action_queue = action_queue
        self.result_queue = result_queue
        self._running = True
        self.current_game_state = self._get_initial_state()

    def _get_initial_state(self):
        # Simulate an initial game state
        return {
            "p1_health": 1.0,
            "p1_pos_x": 0.2,
            "p1_pos_y": 0.0,
            "p2_health": 1.0,
            "p2_pos_x": 0.8,
            "p2_pos_y": 0.0,
            "round_over": False,
            "observation": [0.2, 0.0, 1.0, 0.0, 0.8, 0.0, 1.0, 0.0] # Example observation
        }

    def _update_game_state(self, p1_action: int, p2_action: int):
        # This is a very simplified game logic for demonstration
        # In a real scenario, this would involve a proper game engine simulation
        
        # Simulate health changes based on attack actions
        if p1_action == 4: # P1 Attack1
            self.current_game_state["p2_health"] = max(0.0, self.current_game_state["p2_health"] - 0.1)
        if p2_action == 4: # P2 Attack1
            self.current_game_state["p1_health"] = max(0.0, self.current_game_state["p1_health"] - 0.1)

        # Simulate movement (very basic)
        if p1_action == 1: # P1 MoveFwd
            self.current_game_state["p1_pos_x"] = min(1.0, self.current_game_state["p1_pos_x"] + 0.01)
        if p1_action == 2: # P1 MoveBwd
            self.current_game_state["p1_pos_x"] = max(0.0, self.current_game_state["p1_pos_x"] - 0.01)
        
        if p2_action == 1: # P2 MoveFwd
            self.current_game_state["p2_pos_x"] = min(1.0, self.current_game_state["p2_pos_x"] + 0.01)
        if p2_action == 2: # P2 MoveBwd
            self.current_game_state["p2_pos_x"] = max(0.0, self.current_game_state["p2_pos_x"] - 0.01)

        # Update observation based on new state
        self.current_game_state["observation"] = [
            self.current_game_state["p1_pos_x"],
            self.current_game_state["p1_pos_y"],
            self.current_game_state["p1_health"],
            0.0, # p1_state (dummy)
            self.current_game_state["p2_pos_x"],
            self.current_game_state["p2_pos_y"],
            self.current_game_state["p2_health"],
            0.0  # p2_state (dummy)
        ]

        # Check for round over condition
        if self.current_game_state["p1_health"] <= 0 or self.current_game_state["p2_health"] <= 0:
            self.current_game_state["round_over"] = True
        else:
            self.current_game_state["round_over"] = False

    def run(self):
        logger.info("MockGameClient started.")
        # Simulate connection ready
        self.result_queue.put({"type": "connection_ready"})

        while self._running:
            try:
                message = self.action_queue.get(timeout=1) # Short timeout to check _running flag
                msg_type = message.get("type")

                if msg_type == "action":
                    p1_action = message.get("p1Action", 0)
                    p2_action = message.get("p2Action", 0)
                    self._update_game_state(p1_action, p2_action)
                    self.result_queue.put({"type": "action_result", "state": self.current_game_state})
                elif msg_type == "reset":
                    self.current_game_state = self._get_initial_state()
                    self.result_queue.put({"type": "reset_result", "state": self.current_game_state})
                elif msg_type == "close":
                    self._running = False
                    logger.info("MockGameClient received close signal.")
                else:
                    logger.warning(f"MockGameClient received unknown message type: {msg_type}")
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"MockGameClient error: {e}")
                self._running = False
        logger.info("MockGameClient stopped.")
