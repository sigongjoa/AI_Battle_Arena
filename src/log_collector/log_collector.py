import json
import os
import time
import uuid
import zlib  # For compression
import gzip
import logging

logger = logging.getLogger(__name__)


class LogCollector:
    def __init__(self, log_dir="logs/simulation_logs", compress_after_session=True):
        self.log_dir = log_dir
        self.compress_after_session = compress_after_session
        os.makedirs(self.log_dir, exist_ok=True)
        self.current_session_id = None
        self.current_log_file = None
        self.current_log_filepath = None

    def start_session(self):
        self.current_session_id = str(uuid.uuid4())
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        self.current_log_filepath = os.path.join(self.log_dir, f"session_{timestamp}_{self.current_session_id}.jsonl")
        self.current_log_file = open(self.current_log_filepath, 'w')
        self.log_event("SESSION_START", {"session_id": self.current_session_id, "timestamp": timestamp})
        logger.info(f"Started new session {self.current_session_id}, logging to {self.current_log_filepath}")
        return self.current_session_id

    def log_event(self, event_type, data):
        if not self.current_log_file:
            logger.warning("No active session. Call start_session() first.")
            return

        log_entry = {
            "timestamp": time.time(),
            "session_id": self.current_session_id,
            "event_type": event_type,
            "data": data
        }
        self.current_log_file.write(json.dumps(log_entry) + '\n')

    def end_session(self):
        if self.current_log_file:
            self.log_event("SESSION_END", {"session_id": self.current_session_id, "timestamp": time.time()})
            self.current_log_file.close()
            logger.info(f"Ended session {self.current_session_id}.")
            if self.compress_after_session:
                self._compress_log_file(self.current_log_filepath)
            self.current_session_id = None
            self.current_log_file = None
            self.current_log_filepath = None

    def _compress_log_file(self, filepath):
        try:
            with open(filepath, 'rb') as f_in:
                with gzip.open(filepath + '.gz', 'wb') as f_out:
                    f_out.writelines(f_in)
            os.remove(filepath)
            logger.info(f"Compressed {filepath} to {filepath}.gz and removed original.")
        except Exception as e:
            logger.error(f"Error compressing file {filepath}: {e}", exc_info=True)

    def save_replay_data(self, replay_data, replay_filename="replay.bin"):
        if not self.current_session_id:
            logger.warning("No active session to associate replay data with.")
            return
        
        replay_path = os.path.join(self.log_dir, f"replay_{self.current_session_id}_{replay_filename}")
        # For demonstration, replay_data is just a string. In real scenario, it would be binary.
        with open(replay_path, 'w') as f:
            f.write(replay_data)
        logger.info(f"Replay data saved for session {self.current_session_id} to {replay_path}")
        self.log_event("REPLAY_SAVED", {"replay_path": replay_path})

# Simple test for LogCollector
def test_log_collector():
    print("--- Testing LogCollector ---")
    collector = LogCollector(log_dir="test_logs")
    session_id = collector.start_session()
    
    collector.log_event("GAME_STATE", {"player_pos": (10, 20), "enemy_hp": 80})
    collector.log_event("ACTION", {"type": "punch", "direction": "left"})
    collector.log_event("RHYTHM_METRIC", {"combo_score": 0.85})
    
    collector.save_replay_data("Mock replay data for session " + session_id)
    
    collector.end_session()
    print("--- LogCollector Test Finished ---")

if __name__ == '__main__':
    test_log_collector()
