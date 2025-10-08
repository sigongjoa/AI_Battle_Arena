import os
import time
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from src.metric_extractor.db_manager import DBManager
import sqlite3 # Added for _fetch_session_info, _fetch_qa_metrics, _fetch_immersion_metrics

class ReportGenerator:
    def __init__(self, db_manager: DBManager, template_dir="src/report_generator/templates"):
        self.db_manager = db_manager
        self.template_env = Environment(loader=FileSystemLoader(template_dir))
        self.report_template = self.template_env.get_template("report_template.md.jinja2")
        print("ReportGenerator initialized.")

    def generate_report(self, session_id: str, persona_analysis_results: dict = None, output_dir="reports"):
        print(f"\n--- Generating Report for Session: {session_id} ---")
        os.makedirs(output_dir, exist_ok=True)

        # 1. Fetch data from DB
        session_info = self._fetch_session_info(session_id)
        if not session_info:
            print(f"Error: Session {session_id} not found in DB.")
            return None

        qa_metrics = self._fetch_qa_metrics(session_id)
        immersion_metrics = self._fetch_immersion_metrics(session_id)

        # Convert lists of metric objects to dictionaries for easier template access
        qa_metrics_dict = {m['metric_name']: m for m in qa_metrics}
        immersion_metrics_dict = {m['metric_name']: m for m in immersion_metrics}

        # 2. Mock XAI Evidence Collection (Video clips, log snippets)
        mock_video_briefing_path = f"mock_video_briefing_{session_id}.mp4"
        mock_log_snippet_human_error_path = f"mock_log_snippet_human_error_{session_id}.jsonl"
        # In a real scenario, moviepy/ffmpeg would be used here to cut actual clips
        # and log files would be processed to extract relevant snippets.
        print(f"  Mocking XAI evidence collection for session {session_id}...")

        # 3. Mock AI Avatar Video Briefing (TTS, Blender, FFmpeg)
        # This would involve calling gTTS/Coqui TTS, Blender scripts, and FFmpeg
        # For now, we just acknowledge its conceptual place.
        print(f"  Mocking AI Avatar Video Briefing generation...")

        # 4. Render report using Jinja2 template
        report_content = self.report_template.render(
            session_id=session_id,
            start_time=datetime.fromtimestamp(session_info['start_timestamp']).strftime('%Y-%m-%d %H:%M:%S'),
            end_time=datetime.fromtimestamp(session_info['end_timestamp']).strftime('%Y-%m-%d %H:%M:%S'),
            log_filepath=session_info['log_filepath'],
            replay_filepath=session_info['replay_filepath'],
            qa_metrics=qa_metrics,
            immersion_metrics=immersion_metrics,
            qa_metrics_dict=qa_metrics_dict, # For easier access in hypothesis section
            immersion_metrics_dict=immersion_metrics_dict, # For easier access in hypothesis section
            persona_analysis_results=persona_analysis_results, # Pass persona analysis results
            mock_video_briefing_path=mock_video_briefing_path,
            mock_log_snippet_human_error_path=mock_log_snippet_human_error_path,
            generation_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )

        # 5. Save the report
        report_filename = os.path.join(output_dir, f"qa_report_{session_id}.md")
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write(report_content)
        print(f"  Report saved to {report_filename}")
        
        print(f"--- Report Generation for Session {session_id} Finished ---")
        return report_filename

    def _fetch_session_info(self, session_id: str):
        conn = None
        try:
            conn = sqlite3.connect(self.db_manager.db_file)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
            row = cursor.fetchone()
            if row:
                return {
                    'session_id': row[0],
                    'start_timestamp': row[1],
                    'end_timestamp': row[2],
                    'log_filepath': row[3],
                    'replay_filepath': row[4]
                }
            return None
        except sqlite3.Error as e:
            print(f"DBManager: Error fetching session info for {session_id}: {e}")
            return None
        finally:
            if conn:
                conn.close()

    def _fetch_qa_metrics(self, session_id: str):
        conn = None
        try:
            conn = sqlite3.connect(self.db_manager.db_file)
            cursor = conn.cursor()
            cursor.execute("SELECT metric_name, metric_value, frame_number FROM qa_metrics WHERE session_id = ?", (session_id,))
            return [{'metric_name': row[0], 'metric_value': row[1], 'frame_number': row[2]} for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"DBManager: Error fetching QA metrics for {session_id}: {e}")
            return []
        finally:
            if conn:
                conn.close()

    def _fetch_immersion_metrics(self, session_id: str):
        conn = None
        try:
            conn = sqlite3.connect(self.db_manager.db_file)
            cursor = conn.cursor()
            cursor.execute("SELECT metric_name, metric_value, start_frame, end_frame FROM immersion_metrics WHERE session_id = ?", (session_id,))
            return [{'metric_name': row[0], 'metric_value': row[1], 'start_frame': row[2], 'end_frame': row[3]} for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"DBManager: Error fetching immersion metrics for {session_id}: {e}")
            return []
        finally:
            if conn:
                conn.close()

# Simple test for ReportGenerator
def test_report_generator():
    print("--- Testing ReportGenerator ---")
    db_manager = DBManager()
    generator = ReportGenerator(db_manager)

    # Find a session ID from the DB that has QA metrics
    conn = None
    session_id_to_report = None
    try:
        conn = sqlite3.connect(db_manager.db_file)
        cursor = conn.cursor()
        # Try to find a session that has a StabilityScore metric
        cursor.execute("""
            SELECT s.session_id FROM sessions s
            JOIN qa_metrics qm ON s.session_id = qm.session_id
            WHERE qm.metric_name = 'StabilityScore'
            ORDER BY s.start_timestamp DESC LIMIT 1
        """)
        row = cursor.fetchone()
        if row:
            session_id_to_report = row[0]
        else:
            # If no session with StabilityScore, try to find any session
            cursor.execute("SELECT session_id FROM sessions ORDER BY start_timestamp DESC LIMIT 1")
            row = cursor.fetchone()
            if row:
                session_id_to_report = row[0]

    except sqlite3.Error as e:
        print(f"Error fetching session ID from DB: {e}")
    finally:
        if conn:
            conn.close()

    if session_id_to_report:
        report_path = generator.generate_report(session_id_to_report)
        print(f"Generated report at: {report_path}")
    else:
        print("No suitable sessions found in the database to generate a report for. Please run mock simulations (e.g., mock_multi_persona_analyzer.py) first.")
    
    print("--- ReportGenerator Test Finished ---")

if __name__ == '__main__':
    test_report_generator()
