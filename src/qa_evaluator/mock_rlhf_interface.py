import random
import time
from src.metric_extractor.db_manager import DBManager

class MockRLHFInterface:
    def __init__(self, db_manager: DBManager):
        self.db_manager = db_manager
        print("MockRLHFInterface initialized.")

    def collect_pairwise_comparisons(self, num_comparisons: int = 5):
        print(f"\n--- Collecting {num_comparisons} Pairwise Comparisons (Mock) ---")
        comparisons = []
        mock_clips = ["clip_A_punch_combo", "clip_B_kick_combo", "clip_C_block_counter"]

        for i in range(num_comparisons):
            clip1 = random.choice(mock_clips)
            clip2 = random.choice(mock_clips)
            while clip1 == clip2: # Ensure different clips
                clip2 = random.choice(mock_clips)
            
            preference = random.choice(["A_better", "B_better", "similar"])
            comparisons.append({"clip1": clip1, "clip2": clip2, "preference": preference})
            print(f"  Comparison {i+1}: {clip1} vs {clip2} -> {preference}")
            time.sleep(0.5) # Simulate user input time

        print("Mock pairwise comparison collection completed.")
        return comparisons

    def train_reward_model(self, comparisons: list):
        print(f"\n--- Training Reward Model with {len(comparisons)} Comparisons (Mock) ---")
        # In a real scenario, this would involve training a neural network
        # based on the collected preferences (e.g., using Bradley-Terry model).
        
        time.sleep(3) # Simulate training time
        mock_reward_model_accuracy = random.uniform(0.7, 0.95)
        print(f"Mock reward model trained. Achieved accuracy: {mock_reward_model_accuracy:.2f}")
        
        # Store mock reward model info in DB (e.g., accuracy, model path)!
        # For simplicity, just log a metric
        session_id = "rlhf_training_" + str(int(time.time()))
        self.db_manager.insert_session(session_id, time.time(), time.time() + 3, "N/A", "N/A")
        self.db_manager.insert_qa_metric(session_id, "RewardModelAccuracy", mock_reward_model_accuracy, 0, time.time())
        
        return {"model_path": "models/mock_reward_model.pth", "accuracy": mock_reward_model_accuracy}

if __name__ == '__main__':
    db_manager = DBManager()
    rlhf_interface = MockRLHFInterface(db_manager)
    
    collected_comparisons = rlhf_interface.collect_pairwise_comparisons(num_comparisons=10)
    reward_model_info = rlhf_interface.train_reward_model(collected_comparisons)
    print(f"\nMock Reward Model Info: {reward_model_info}")
