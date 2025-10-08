import random
from collections import deque
from src.utils.config_loader import load_config

class HumanErrorLayer:
    def __init__(self):
        self.config = load_config().get('simulation', {}).get('human_error', {})
        self.reaction_time_mean = self.config.get('reaction_time_mean', 0)
        self.reaction_time_std = self.config.get('reaction_time_std', 0)
        self.mistake_probability = self.config.get('mistake_probability', 0.0)
        self.drop_probability = self.config.get('drop_probability', 0.0)

        self.input_queue = deque()
        self.current_delay = 0

    def apply_human_error(self, action):
        """
        Applies human-like errors (delay, mistake, drop) to an action.
        Assumes action is a simple string or dict for demonstration.
        """
        # Simulate input drop
        if action is not None and random.random() < self.drop_probability:
            return None

        # If a new action is provided, queue it up and calculate new delay if not already delaying
        if action is not None:
            self.input_queue.append(action)
            if self.current_delay == 0: # Only calculate new delay if not already delaying
                self.current_delay = max(0, int(random.gauss(self.reaction_time_mean, self.reaction_time_std)))
            
        # If no actions in queue, or still delaying, return None
        if not self.input_queue or self.current_delay > 0:
            if self.current_delay > 0:
                self.current_delay -= 1
            return None

        # Delay finished, get action from queue
        processed_action = self.input_queue.popleft()
        self.current_delay = 0 # Reset delay after processing an action

        # Simulate input mistake
        if random.random() < self.mistake_probability:
            if isinstance(processed_action, str):
                mistake_action = processed_action + "_mistake"
            elif isinstance(processed_action, dict) and 'move' in processed_action:
                mistake_action = processed_action.copy()
                mistake_action['move'] = 'random_move'
            else:
                mistake_action = "mistake"
            return mistake_action
        
        return processed_action

# Simple test function for human_error_layer
def test_human_error_layer():
    print("--- Testing HumanErrorLayer ---")
    error_layer = HumanErrorLayer()
    
    # Override config for predictable testing
    error_layer.reaction_time_mean = 2
    error_layer.reaction_time_std = 0
    error_layer.mistake_probability = 0.2
    error_layer.drop_probability = 0.1

    actions = ["punch", "kick", "block", "jump"]
    
    print(f"Config: mean_delay={error_layer.reaction_time_mean}, mistake_prob={error_layer.mistake_probability}, drop_prob={error_layer.drop_probability}")

    for i in range(10):
        current_action = actions[i % len(actions)]
        print(f"\nFrame {i+1}: Sending action '{current_action}'")
        output_action = error_layer.apply_human_error(current_action)
        if output_action:
            print(f"  Output: {output_action}")
        else:
            print("  Output: None (delayed or dropped)")

if __name__ == '__main__':
    test_human_error_layer()