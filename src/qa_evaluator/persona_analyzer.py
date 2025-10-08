import sqlite3
import os
import pandas as pd
from itertools import combinations
import random # Added for random choices in mock analysis
from src.metric_extractor.db_manager import DBManager
from src.qa_evaluator.ai_personas import PERSONAS

class PersonaAnalyzer:
    def __init__(self, db_manager: DBManager):
        self.db_manager = db_manager
        print("PersonaAnalyzer initialized.")

    def analyze_persona_experiments(self, persona_names: list[str]):
        print("\n--- Analyzing Persona Experiment Results ---")
        
        conn = None
        try:
            conn = sqlite3.connect(self.db_manager.db_file)
            
            # Fetch all relevant session and metric data
            query = """
                SELECT 
                    s.session_id, s.start_timestamp, s.end_timestamp,
                    qm.metric_name AS qa_metric_name, qm.metric_value AS qa_metric_value,
                    im.metric_name AS immersion_metric_name, im.metric_value AS immersion_metric_value
                FROM sessions s
                LEFT JOIN qa_metrics qm ON s.session_id = qm.session_id
                LEFT JOIN immersion_metrics im ON s.session_id = im.session_id
                WHERE s.session_id LIKE 'session_%' -- Filter out RLHF training sessions
                ORDER BY s.start_timestamp DESC
            """
            df = pd.read_sql_query(query, conn)

            if df.empty:
                print("No persona experiment data found in the database.")
                return {}

            # Aggregate metrics per session
            session_metrics = {}
            for session_id, group in df.groupby('session_id'):
                session_metrics[session_id] = {
                    'start_timestamp': group['start_timestamp'].iloc[0],
                    'end_timestamp': group['end_timestamp'].iloc[0],
                    'qa_metrics': {row['qa_metric_name']: row['qa_metric_value'] for idx, row in group.iterrows() if pd.notna(row['qa_metric_name'])},
                    'immersion_metrics': {row['immersion_metric_name']: row['immersion_metric_value'] for idx, row in group.iterrows() if pd.notna(row['immersion_metric_name'])}
                }
            
            # Mock analysis for each persona pair
            analysis_results = {}
            persona_pairs = list(combinations(persona_names, 2))
            
            for p1_name, p2_name in persona_pairs:
                print(f"\n  Comparing {p1_name} vs {p2_name}:")
                # In a real scenario, we would filter sessions where these two personas fought
                # and then analyze their aggregated metrics.
                
                # For mock, we'll just generate some random comparison results
                avg_stability = df['qa_metric_value'].loc[df['qa_metric_name'] == 'StabilityScore'].mean()
                avg_balance = df['qa_metric_value'].loc[df['qa_metric_name'] == 'BalanceScore'].mean()
                avg_responsiveness = df['qa_metric_value'].loc[df['qa_metric_name'] == 'ResponsivenessScore'].mean()
                avg_combo_rhythm = df['immersion_metric_value'].loc[df['immersion_metric_name'] == 'ComboRhythmScore'].mean()
                
                # Add FunScore to mock analysis
                avg_fun_score = df['immersion_metric_value'].loc[df['immersion_metric_name'] == 'FunScore'].mean()

                analysis_results[f"{p1_name}_vs_{p2_name}"] = {
                    "avg_stability": avg_stability if pd.notna(avg_stability) else random.uniform(0.8, 1.0),
                    "avg_balance": avg_balance if pd.notna(avg_balance) else random.uniform(0.7, 1.0),
                    "avg_responsiveness": avg_responsiveness if pd.notna(avg_responsiveness) else random.uniform(0.7, 1.0),
                    "avg_combo_rhythm": avg_combo_rhythm if pd.notna(avg_combo_rhythm) else random.uniform(0.6, 0.9),
                    "avg_fun_score": avg_fun_score if pd.notna(avg_fun_score) else random.uniform(0.5, 1.0), # Added FunScore
                    "conclusion": f"Mock analysis: {p1_name} showed slightly better {random.choice(['stability', 'balance', 'rhythm', 'fun'])} against {p2_name}."
                }
                print(f"    Conclusion: {analysis_results[f'{p1_name}_vs_{p2_name}']['conclusion']}")

            print("\n--- Persona Experiment Analysis Finished ---")
            return analysis_results

        except sqlite3.Error as e:
            print(f"PersonaAnalyzer: Error accessing database: {e}")
            return {}
        finally:
            if conn:
                conn.close()

# Simple test for PersonaAnalyzer
def test_persona_analyzer():
    print("--- Testing PersonaAnalyzer ---")
    db_manager = DBManager()
    analyzer = PersonaAnalyzer(db_manager)
    
    # Ensure some data exists in the DB from previous runs
    # For a clean test, you might want to run mock_multi_persona_orchestrator first
    
    personas_to_analyze = ["Beginner AI", "Pro-gamer AI", "Pressure AI"]
    results = analyzer.analyze_persona_experiments(personas_to_analyze)
    
    if results:
        print("\nAnalysis Results:")
        for pair, data in results.items():
            print(f"  {pair}: {data['conclusion']}")
    else:
        print("No analysis results generated.")
    
    print("--- PersonaAnalyzer Test Finished ---")

if __name__ == '__main__':
    test_persona_analyzer()
