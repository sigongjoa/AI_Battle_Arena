import random
import time
from src.qa_evaluator.ai_personas import PERSONAS
from src.simulation.mock_simulation_arena import run_mock_simulation # Re-use the mock arena
from src.metric_extractor.db_manager import DBManager
from src.metric_extractor.metric_extractor import MetricExtractor
import os

class MockMultiPersonaAnalyzer:
    def __init__(self, db_manager: DBManager):
        self.db_manager = db_manager
        self.metric_extractor = MetricExtractor(db_manager)
        print("MockMultiPersonaAnalyzer initialized.")

    def analyze_personas(self, persona_names: list[str], num_simulations_per_pair: int = 1):
        print("\n--- Analyzing Multiple Personas ---")
        
        if len(persona_names) < 2:
            print("Need at least two personas for comparison.")
            return

        results = {}
        for i in range(len(persona_names)):
            for j in range(i + 1, len(persona_names)):
                persona1_name = persona_names[i]
                persona2_name = persona_names[j]
                
                print(f"\n--- Simulating {persona1_name} vs {persona2_name} ---")
                
                for sim_idx in range(num_simulations_per_pair):
                    print(f"  Running simulation {sim_idx + 1}/{num_simulations_per_pair}...")
                    
                    # Simulate running the arena with these personas
                    # In a real scenario, the mock_simulation_arena would be adapted
                    # to take persona models as input and run a match.
                    # For now, we just run the generic mock arena and extract metrics.
                    run_mock_simulation(num_frames=random.randint(20, 50)) # Run for a random duration
                    
                    # After simulation, extract metrics from the latest log file
                    log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'simulation_logs'))
                    log_files = [os.path.join(log_dir, f) for f in os.listdir(log_dir) if f.endswith('.jsonl.gz')]
                    if log_files:
                        latest_log_file = max(log_files, key=os.path.getctime)
                        self.metric_extractor.extract_metrics_from_log(latest_log_file)
                        print(f"  Metrics extracted for simulation {sim_idx + 1}.")
                    else:
                        print("  No log file found to extract metrics from.")
                
                # Placeholder for analysis results
                results[f"{persona1_name}_vs_{persona2_name}"] = {
                    "avg_stability": random.uniform(0.8, 1.0),
                    "avg_balance": random.uniform(0.7, 1.0),
                    "avg_responsiveness": random.uniform(0.7, 1.0),
                    "avg_combo_rhythm": random.uniform(0.6, 0.9),
                    "conclusion": f"Mock analysis: {persona1_name} showed slightly better {random.choice(['stability', 'balance', 'rhythm'])}."
                }
        
        print("\n--- Multi-Persona Analysis Results (Mock) ---")
        for pair, data in results.items():
            print(f"\nPair: {pair}")
            for key, value in data.items():
                print(f"  {key}: {value}")
        
        return results

if __name__ == '__main__':
    db_manager = DBManager()
    analyzer = MockMultiPersonaAnalyzer(db_manager)
    
    personas_to_analyze = ["Beginner AI", "Pro-gamer AI", "Pressure AI"]
    analyzer.analyze_personas(personas_to_analyze, num_simulations_per_pair=2)