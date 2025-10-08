import random
import time
import os
from itertools import combinations

from src.qa_evaluator.ai_personas import PERSONAS, AIPersona
from src.simulation.mock_simulation_arena import run_mock_simulation
from src.metric_extractor.db_manager import DBManager
from src.metric_extractor.metric_extractor import MetricExtractor
from src.simulation.human_error_layer import HumanErrorLayer # To dynamically set error tolerance

class MultiPersonaOrchestrator:
    def __init__(self, db_manager: DBManager):
        self.db_manager = db_manager
        self.metric_extractor = MetricExtractor(db_manager)
        print("MultiPersonaOrchestrator initialized.")

    def run_experiments(self, persona_names: list[str], num_matches_per_pair: int = 1):
        print("\n--- Running Multi-Persona Experiments ---")
        
        if len(persona_names) < 2:
            print("Need at least two personas for comparison experiments.")
            return

        personas_to_experiment = [PERSONAS[name] for name in persona_names if name in PERSONAS]
        if len(personas_to_experiment) != len(persona_names):
            print("Warning: Some specified personas were not found and will be skipped.")

        # Generate all unique pairs for matches
        persona_pairs = list(combinations(personas_to_experiment, 2))

        for p1, p2 in persona_pairs:
            print(f"\n--- Experiment: {p1.name} vs {p2.name} ({num_matches_per_pair} matches) ---")
            for match_idx in range(num_matches_per_pair):
                print(f"  Match {match_idx + 1}/{num_matches_per_pair}:")
                
                # Simulate loading models (mock)
                print(f"    Loading models for {p1.name} and {p2.name}...")
                # In a real scenario, trained models would be loaded here.
                # mock_model_p1 = load_model(p1.name)
                # mock_model_p2 = load_model(p2.name)

                # Dynamically set Human Error Layer parameters for the simulation
                # For simplicity, we'll use p1's error_tolerance for the simulation
                # In a real scenario, each player in the arena would have their own H.E.L.
                # and Network Sim based on their persona.
                print(f"    Setting Human Error Layer tolerance for simulation based on {p1.name} ({p1.error_tolerance})...")
                # This would involve modifying the config or passing parameters to the arena.
                # For this mock, we'll just acknowledge it.

                # Run mock simulation arena
                # The mock_simulation_arena needs to be adapted to take persona parameters
                # For now, it runs a generic simulation, and we'll extract metrics.
                print("    Running mock simulation arena...")
                run_mock_simulation(num_frames=random.randint(30, 60)) # Run for a random duration
                
                # After simulation, extract metrics from the latest log file
                log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'simulation_logs'))
                log_files = [os.path.join(log_dir, f) for f in os.listdir(log_dir) if f.endswith('.jsonl.gz')]
                if log_files:
                    latest_log_file = max(log_files, key=os.path.getctime)
                    self.metric_extractor.extract_metrics_from_log(latest_log_file)
                    print(f"    Metrics extracted for match {match_idx + 1}.")
                else:
                    print("    No log file found to extract metrics from.")
                
                time.sleep(0.5) # Simulate match processing time

        print("\n--- Multi-Persona Experiments Finished ---")

if __name__ == '__main__':
    db_manager = DBManager()
    orchestrator = MultiPersonaOrchestrator(db_manager)
    
    personas_to_test = ["Beginner AI", "Pro-gamer AI", "Pressure AI", "Troll AI"]
    orchestrator.run_experiments(personas_to_test, num_matches_per_pair=2)