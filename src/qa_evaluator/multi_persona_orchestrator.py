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

                # Prepare persona config for the simulation
                # For simplicity, we'll use p1's config for the simulation environment
                # In a real scenario, each player in the arena would have their own configs applied.
                persona_config_for_sim = {
                    'error_tolerance': p1.error_tolerance,
                    'action_masking_rules': p1.action_masking_rules,
                    'custom_reward_function_config': p1.custom_reward_function_config
                }
                print(f"    Applying simulation config based on {p1.name}...")

                # Acknowledge Imitation Learning and Curiosity-Driven Exploration if configured
                if p1.training_params.get('use_imitation_learning'):
                    print(f"    {p1.name} is using Imitation Learning pre-training.")
                if p1.training_params.get('use_curiosity_exploration'):
                    print(f"    {p1.name} is using Curiosity-Driven Exploration.")
                if p2.training_params.get('use_imitation_learning'):
                    print(f"    {p2.name} is using Imitation Learning pre-training.")
                if p2.training_params.get('use_curiosity_exploration'):
                    print(f"    {p2.name} is using Curiosity-Driven Exploration.")

                # Run mock simulation arena with persona config
                print("    Running mock simulation arena...")
                session_id = run_mock_simulation(num_frames=random.randint(30, 60), persona_config=persona_config_for_sim)
                
                # After simulation, extract metrics from the log file associated with the session_id
                log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'simulation_logs'))
                # Find the actual log file, as timestamp might vary slightly
                found_log_files = [f for f in os.listdir(log_dir) if session_id in f and f.endswith('.jsonl.gz')]
                if found_log_files:
                    actual_log_filepath = os.path.join(log_dir, found_log_files[0])
                    self.metric_extractor.extract_metrics_from_log(actual_log_filepath)
                    print(f"    Metrics extracted for match {match_idx + 1} from {actual_log_filepath}.")
                else:
                    print(f"    No log file found for session {session_id} to extract metrics from.")
                
                time.sleep(0.5) # Simulate match processing time

        print("\n--- Multi-Persona Experiments Finished ---")

if __name__ == '__main__':
    db_manager = DBManager()
    orchestrator = MultiPersonaOrchestrator(db_manager)
    
    personas_to_test = ["Beginner AI", "Pro-gamer AI", "Pressure AI", "Troll AI"]
    orchestrator.run_experiments(personas_to_test, num_matches_per_pair=2)