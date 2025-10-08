import os
import time
import sqlite3
from src.simulation.mock_simulation_arena import run_mock_simulation
from src.metric_extractor.db_manager import DBManager
from src.metric_extractor.metric_extractor import MetricExtractor
from src.qa_evaluator.mock_rl_trainer import MockRLTrainer
from src.qa_evaluator.mock_multi_persona_analyzer import MockMultiPersonaAnalyzer
from src.qa_evaluator.mock_rlhf_interface import MockRLHFInterface
from src.report_generator.report_generator import ReportGenerator

def run_full_qa_pipeline(num_simulations=2, num_comparisons=5):
    print("--- Starting Full AI-Driven QA Pipeline ---")

    db_manager = DBManager()
    
    # Step 1 & 2: Simulation Arena & Log Collector (demonstrated by mock_simulation_arena)
    # The mock_multi_persona_analyzer will run mock_simulation_arena multiple times
    # and log data, so we'll rely on that for this part.

    # Step 4.1: AI Persona Training (Mock)
    print("\n--- Step 4.1: AI Persona Training (Mock) ---")
    rl_trainer = MockRLTrainer()
    pro_gamer_model_path = rl_trainer.train_persona("Pro-gamer AI", total_timesteps=50000)
    beginner_model_path = rl_trainer.train_persona("Beginner AI", total_timesteps=10000)
    pressure_model_path = rl_trainer.train_persona("Pressure AI", total_timesteps=20000)
    troll_model_path = rl_trainer.train_persona("Troll AI", total_timesteps=15000) # Train Troll AI
    out_fighter_model_path = rl_trainer.train_persona("Out-fighter AI", total_timesteps=25000, use_imitation_learning=True) # Train Out-fighter with IL
    in_fighter_model_path = rl_trainer.train_persona("In-fighter AI", total_timesteps=25000)
    slugger_model_path = rl_trainer.train_persona("Slugger AI", total_timesteps=20000)
    
    # Step 4.2 & 3: Multi-Persona Analysis & Metric Extraction
    print("\n--- Step 4.2 & 3: Multi-Persona Analysis & Metric Extraction ---")
    multi_persona_analyzer = MockMultiPersonaAnalyzer(db_manager)
    # Include all personas in the analysis
    personas_to_analyze = ["Beginner AI", "Pro-gamer AI", "Pressure AI", "Troll AI", "Out-fighter AI", "In-fighter AI", "Slugger AI"]
    analysis_results = multi_persona_analyzer.analyze_personas(personas_to_analyze, num_simulations_per_pair=num_simulations)

    # Step 4.3: RLHF Framework (Mock)
    print("\n--- Step 4.3: RLHF Framework (Mock) ---")
    rlhf_interface = MockRLHFInterface(db_manager)
    collected_comparisons = rlhf_interface.collect_pairwise_comparisons(num_comparisons=num_comparisons)
    reward_model_info = rlhf_interface.train_reward_model(collected_comparisons)
    print(f"Mock Reward Model Info: {reward_model_info}")

    # Step 5: Report Generation
    print("\n--- Step 5: Report Generation ---")
    report_generator = ReportGenerator(db_manager)
    
    # Generate reports for the sessions created by multi_persona_analyzer
    # We need to fetch session IDs that have QA metrics
    conn = None
    session_ids_for_reports = []
    try:
        conn = sqlite3.connect(db_manager.db_file)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT s.session_id FROM sessions s
            JOIN qa_metrics qm ON s.session_id = qm.session_id
            WHERE qm.metric_name = 'StabilityScore'
            ORDER BY s.start_timestamp DESC LIMIT ?
        """, (len(personas_to_analyze) * (len(personas_to_analyze) - 1) // 2 * num_simulations,))
        session_ids_for_reports = [row[0] for row in cursor.fetchall()]
    except sqlite3.Error as e:
        print(f"Error fetching session IDs for reports: {e}")
    finally:
        if conn:
            conn.close()

    generated_reports = []
    for session_id in session_ids_for_reports:
        report_path = report_generator.generate_report(session_id, persona_analysis_results=analysis_results)
        if report_path:
            generated_reports.append(report_path)
    
    print(f"\nGenerated {len(generated_reports)} QA reports.")

    print("\n--- Full AI-Driven QA Pipeline Finished ---")
    return generated_reports

if __name__ == '__main__':
    # Ensure the database is clean for a full pipeline run
    db_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'db', 'metrics.db'))
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"Removed existing DB: {db_file}")
    
    # Ensure logs directory is clean
    log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'logs', 'simulation_logs'))
    if os.path.exists(log_dir):
        for f in os.listdir(log_dir):
            os.remove(os.path.join(log_dir, f))
        os.rmdir(log_dir)
        print(f"Removed existing log directory: {log_dir}")
    
    # Ensure reports directory is clean
    reports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'reports'))
    if os.path.exists(reports_dir):
        for f in os.listdir(reports_dir):
            os.remove(os.path.join(reports_dir, f))
        os.rmdir(reports_dir)
        print(f"Removed existing reports directory: {reports_dir}")

    run_full_qa_pipeline(num_simulations=1, num_comparisons=3) # Reduced for quicker demo
