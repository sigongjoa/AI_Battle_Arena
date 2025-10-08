import json
import os
import gzip
import pandas as pd
import numpy as np
import time
from src.metric_extractor.db_manager import DBManager
from src.utils.event_types import *

class MetricExtractor:
    def __init__(self, db_manager: DBManager):
        self.db_manager = db_manager
        self.session_data = {} # To store parsed data for a session

    def extract_metrics_from_log(self, log_filepath: str):
        session_id = self._parse_session_id_from_filepath(log_filepath)
        if not session_id:
            print(f"MetricExtractor: Could not parse session ID from {log_filepath}")
            return

        print(f"MetricExtractor: Extracting metrics for session {session_id} from {log_filepath}")
        
        events = self._read_jsonl_gz(log_filepath)
        if not events:
            print(f"MetricExtractor: No events found in {log_filepath}")
            return

        self.session_data = self._process_events(events)
        
        # Store session info in DB
        session_start_time = self.session_data.get('start_timestamp')
        session_end_time = self.session_data.get('end_timestamp')
        replay_filepath = self.session_data.get('replay_filepath')
        
        if session_start_time and session_end_time:
            self.db_manager.insert_session(session_id, session_start_time, session_end_time, log_filepath, replay_filepath)
        else:
            print(f"MetricExtractor: Missing start/end timestamps for session {session_id}")
            return

        # Calculate and store QA Metrics
        self._calculate_and_store_qa_metrics(session_id)

        # Calculate and store Immersion/Rhythm Metrics
        self._calculate_and_store_immersion_metrics(session_id)
        
        print(f"MetricExtractor: Finished extracting and storing metrics for session {session_id}")

    def _parse_session_id_from_filepath(self, filepath: str) -> str | None:
        # Expected format: session_YYYYMMDD_HHMMSS_UUID.jsonl.gz
        filename = os.path.basename(filepath)
        parts = filename.split('_')
        if len(parts) >= 4:
            return parts[3].split('.')[0] # Get UUID part
        return None

    def _read_jsonl_gz(self, filepath: str) -> list:
        events = []
        try:
            with gzip.open(filepath, 'rt', encoding='utf-8') as f:
                for line in f:
                    events.append(json.loads(line))
        except FileNotFoundError:
            print(f"MetricExtractor: Log file not found: {filepath}")
        except Exception as e:
            print(f"MetricExtractor: Error reading log file {filepath}: {e}")
        return events

    def _process_events(self, events: list) -> dict:
        processed_data = {
            'start_timestamp': None,
            'end_timestamp': None,
            'game_states': [],
            'actions': [],
            'human_errors': [],
            'network_conditions': [],
            'replay_filepath': None
        }
        
        for event in events:
            event_type = event.get('event_type')
            data = event.get('data', {})
            timestamp = event.get('timestamp')

            if event_type == "SESSION_START":
                processed_data['start_timestamp'] = timestamp
            elif event_type == "SESSION_END":
                processed_data['end_timestamp'] = timestamp
            elif event_type == GAME_STATE_EVENT:
                processed_data['game_states'].append({'timestamp': timestamp, 'frame': len(processed_data['game_states']), **data})
            elif event_type == ACTION_EVENT:
                processed_data['actions'].append({'timestamp': timestamp, 'frame': len(processed_data['actions']), **data})
            elif event_type == HUMAN_ERROR_INJECTED_EVENT:
                processed_data['human_errors'].append({'timestamp': timestamp, 'frame': len(processed_data['human_errors']), **data})
            elif event_type == NETWORK_CONDITION_EVENT:
                processed_data['network_conditions'].append({'timestamp': timestamp, 'frame': len(processed_data['network_conditions']), **data})
            elif event_type == "REPLAY_SAVED":
                processed_data['replay_filepath'] = data.get('replay_path')
        
        return processed_data

    def _calculate_and_store_qa_metrics(self, session_id: str):
        # Mock implementation for QA metrics
        # In a real scenario, these would be calculated from processed_data
        
        # StabilityScore (e.g., inverse of error rate or crash count)
        # For now, let's assume a high stability score if no critical errors logged
        stability_score = 1.0 - (len(self.session_data['human_errors']) / max(1, len(self.session_data['actions'])))
        self.db_manager.insert_qa_metric(session_id, "StabilityScore", stability_score, 0, time.time())

        # BalanceScore (e.g., based on win rates, which we don't have in mock log)
        # Placeholder: random value
        balance_score = np.random.uniform(0.5, 1.0)
        self.db_manager.insert_qa_metric(session_id, "BalanceScore", balance_score, 0, time.time())

        # ResponsivenessScore (e.g., inverse of average input latency)
        # Placeholder: random value
        responsiveness_score = np.random.uniform(0.7, 1.0)
        self.db_manager.insert_qa_metric(session_id, "ResponsivenessScore", responsiveness_score, 0, time.time())
        
        print(f"MetricExtractor: Stored QA metrics for session {session_id}")

    def _calculate_and_store_immersion_metrics(self, session_id: str):
        # Mock implementation for Immersion/Rhythm metrics
        # These would require more complex analysis of action sequences and game states
        
        # TensionIndex (Placeholder)
        tension_index = np.random.uniform(0.3, 0.9)
        self.db_manager.insert_immersion_metric(session_id, "TensionIndex", tension_index, 0, len(self.session_data['game_states']), time.time())

        # ComboRhythmScore (Placeholder)
        combo_rhythm_score = np.random.uniform(0.6, 0.95)
        self.db_manager.insert_immersion_metric(session_id, "ComboRhythmScore", combo_rhythm_score, 0, len(self.session_data['game_states']), time.time())

        # CounterPlayScore (Placeholder)
        counter_play_score = np.random.uniform(0.4, 0.8)
        self.db_manager.insert_immersion_metric(session_id, "CounterPlayScore", counter_play_score, 0, len(self.session_data['game_states']), time.time())
        
        print(f"MetricExtractor: Stored Immersion/Rhythm metrics for session {session_id}")

# Simple test for MetricExtractor
def test_metric_extractor():
    print("--- Testing MetricExtractor ---")
    # Ensure DB is clean for test
    db_manager = DBManager() # This will create/connect to metrics.db
    
    # Need a log file to test with
    # For this test, we'll use the log file generated by the mock simulation arena
    log_files = []
    log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'simulation_logs'))
    for f in os.listdir(log_dir):
        if f.endswith('.jsonl.gz'):
            log_files.append(os.path.join(log_dir, f))
    
    if not log_files:
        print("No .jsonl.gz log files found. Please run mock_simulation_arena.py first.")
        return

    latest_log_file = max(log_files, key=os.path.getctime) # Get the latest log file
    print(f"Using latest log file: {latest_log_file}")

    extractor = MetricExtractor(db_manager)
    extractor.extract_metrics_from_log(latest_log_file)
    
    print("--- MetricExtractor Test Finished ---")

if __name__ == '__main__':
    test_metric_extractor()
