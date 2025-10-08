import time
from src.simulation.human_error_layer import HumanErrorLayer
from src.simulation.network_simulator import NetworkSimulator

def run_mock_simulation(num_frames=20):
    print("--- Running Mock Simulation Arena ---")
    human_error_layer = HumanErrorLayer()
    network_simulator = NetworkSimulator()

    print("\n--- Human Error Layer Config ---")
    print(f"Reaction Time Mean: {human_error_layer.reaction_time_mean} frames")
    print(f"Mistake Probability: {human_error_layer.mistake_probability}")
    print(f"Drop Probability: {human_error_layer.drop_probability}")

    print("\n--- Network Simulator Config ---")
    print(f"Latency Mean: {network_simulator.latency_mean} ms")
    print(f"Packet Loss Probability: {network_simulator.packet_loss_probability}")

    actions_to_send = ["punch", "kick", "block", "jump", "special"]
    
    print("\n--- Simulation Log ---")
    for frame in range(num_frames):
        print(f"\n--- Frame {frame + 1} ---")
        
        # AI generates an action
        ai_action = actions_to_send[frame % len(actions_to_send)]
        print(f"AI Generated Action: {ai_action}")

        # 1. Apply Human Error Layer
        processed_by_human_error = human_error_layer.apply_human_error(ai_action)
        if processed_by_human_error is None:
            print(f"  Human Error Layer Output: None (Input delayed or dropped)")
        else:
            print(f"  Human Error Layer Output: {processed_by_human_error}")

        # 2. Apply Network Simulation (if action exists after human error)
        final_action_for_game = None
        if processed_by_human_error:
            final_action_for_game = network_simulator.simulate_network_conditions(processed_by_human_error)
            if final_action_for_game is None:
                print(f"  Network Simulator Output: None (Packet lost or in transit)")
            else:
                print(f"  Network Simulator Output: {final_action_for_game} (Delivered to Game)")
        else:
            # Still need to process any queued network packets even if no new action from human error layer
            final_action_for_game = network_simulator.simulate_network_conditions(None)
            if final_action_for_game:
                print(f"  Network Simulator Output: {final_action_for_game} (Delivered from queue to Game)")


        # Simulate game processing time
        time.sleep(0.05)

    print("\n--- Mock Simulation Arena Finished ---")

if __name__ == '__main__':
    run_mock_simulation()
