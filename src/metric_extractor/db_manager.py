import sqlite3
import os
import time

DATABASE_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'db', 'metrics.db'))

class DBManager:
    def __init__(self, db_file=DATABASE_FILE):
        self.db_file = db_file
        self._create_tables()

    def _create_tables(self):
        conn = None
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            
            # Table for simulation sessions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    start_timestamp REAL,
                    end_timestamp REAL,
                    log_filepath TEXT,
                    replay_filepath TEXT
                )
            """)

            # Table for QA Metrics
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS qa_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    metric_name TEXT,
                    metric_value REAL,
                    frame_number INTEGER,
                    timestamp REAL,
                    FOREIGN KEY (session_id) REFERENCES sessions (session_id)
                )
            """)
            
            # Table for Immersion/Rhythm Metrics
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS immersion_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    metric_name TEXT,
                    metric_value REAL,
                    start_frame INTEGER,
                    end_frame INTEGER,
                    timestamp REAL,
                    FOREIGN KEY (session_id) REFERENCES sessions (session_id)
                )
            """)

            conn.commit()
            print(f"DBManager: Tables created or already exist in {self.db_file}")
        except sqlite3.Error as e:
            print(f"DBManager: Error creating tables: {e}")
        finally:
            if conn:
                conn.close()

    def insert_session(self, session_id, start_timestamp, end_timestamp, log_filepath, replay_filepath):
        conn = None
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO sessions (session_id, start_timestamp, end_timestamp, log_filepath, replay_filepath)
                VALUES (?, ?, ?, ?, ?)
            """, (session_id, start_timestamp, end_timestamp, log_filepath, replay_filepath))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            print(f"DBManager: Session {session_id} already exists.")
            return False
        except sqlite3.Error as e:
            print(f"DBManager: Error inserting session {session_id}: {e}")
            return False
        finally:
            if conn:
                conn.close()

    def insert_qa_metric(self, session_id, metric_name, metric_value, frame_number, timestamp):
        conn = None
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO qa_metrics (session_id, metric_name, metric_value, frame_number, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (session_id, metric_name, metric_value, frame_number, timestamp))
            conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"DBManager: Error inserting QA metric {metric_name} for session {session_id}: {e}")
            return False
        finally:
            if conn:
                conn.close()

    def insert_immersion_metric(self, session_id, metric_name, metric_value, start_frame, end_frame, timestamp):
        conn = None
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO immersion_metrics (session_id, metric_name, metric_value, start_frame, end_frame, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (session_id, metric_name, metric_value, start_frame, end_frame, timestamp))
            conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"DBManager: Error inserting immersion metric {metric_name} for session {session_id}: {e}")
            return False
        finally:
            if conn:
                conn.close()

# Simple test for DBManager
def test_db_manager():
    print("--- Testing DBManager ---")
    # Ensure a clean test environment
    if os.path.exists(DATABASE_FILE):
        os.remove(DATABASE_FILE)
        print(f"Removed existing DB: {DATABASE_FILE}")

    db_manager = DBManager()
    
    test_session_id = "test_session_123"
    db_manager.insert_session(test_session_id, time.time(), time.time() + 100, "log_path.jsonl.gz", "replay_path.bin")
    db_manager.insert_qa_metric(test_session_id, "StabilityScore", 0.95, 10, time.time())
    db_manager.insert_immersion_metric(test_session_id, "ComboRhythmScore", 0.88, 5, 8, time.time())
    
    print("--- DBManager Test Finished ---")

if __name__ == '__main__':
    test_db_manager()
