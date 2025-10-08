import time
import random # Added for potential random replay data
from src.simulation.human_error_layer import HumanErrorLayer
from src.simulation.network_simulator import NetworkSimulator
from src.log_collector.log_collector import LogCollector
from src.utils.event_types import * # Import all event types

def run_mock_simulation(num_frames=20):
    print("--- Running Mock Simulation Arena ---")
    human_error_layer = HumanErrorLayer()
    network_simulator = NetworkSimulator()
    log_collector = LogCollector() # Initialize LogCollector

    session_id = log_collector.start_session() # Start a new logging session

    print("\n--- Human Error Layer Config ---")
    print(f"Reaction Time Mean: {human_error_layer.reaction_time_mean} frames")
    print(f"Mistake Probability: {human_error_layer.mistake_probability}")
    print(f"Drop Probability: {human_error_layer.drop_probability}")

    print("\n--- Network Simulator Config ---")
    print(f"Latency Mean: {network_simulator.latency_mean} ms")
    print(f"Packet Loss Probability: {network_simulator.packet_loss_probability}")

    actions_to_send = ["punch", "kick", "block", "jump", "special"]
    
    # Mock game state for logging
    mock_game_state = {"player_hp": 100, "enemy_hp": 100, "player_pos": (0,0), "enemy_pos": (10,0)}

    print("\n--- Simulation Log ---")
    for frame in range(num_frames):
        print(f"\n--- Frame {frame + 1} ---")
        
        # Log current game state
        mock_game_state["player_pos"] = (random.randint(-5,5), random.randint(-5,5))
        mock_game_state["enemy_pos"] = (random.randint(5,15), random.randint(-5,5))
        log_collector.log_event(GAME_STATE_EVENT, mock_game_state.copy())
        print(f"  Logged Game State: {mock_game_state}")

        # AI generates an action
        ai_action = actions_to_send[frame % len(actions_to_send)]
        log_collector.log_event(ACTION_EVENT, {"ai_generated_action": ai_action})
        print(f"AI Generated Action: {ai_action}")

        # 1. Apply Human Error Layer
        processed_by_human_error = human_error_layer.apply_human_error(ai_action)
        if processed_by_human_error is None:
            print(f"  Human Error Layer Output: None (Input delayed or dropped)")
            log_collector.log_event(HUMAN_ERROR_INJECTED_EVENT, {"original_action": ai_action, "error_type": "delay_or_drop"})
        else:
            print(f"  Human Error Layer Output: {processed_by_human_error}")
            if processed_by_human_error != ai_action: # If it was a mistake
                log_collector.log_event(HUMAN_ERROR_INJECTED_EVENT, {"original_action": ai_action, "error_type": "mistake", "processed_action": processed_by_human_error})

        # 2. Apply Network Simulation (if action exists after human error)
        final_action_for_game = None
        if processed_by_human_error:
            final_action_for_game = network_simulator.simulate_network_conditions(processed_by_human_error)
            if final_action_for_game is None:
                print(f"  Network Simulator Output: None (Packet lost or in transit)")
                log_collector.log_event(NETWORK_CONDITION_EVENT, {"packet_status": "lost_or_in_transit", "data": processed_by_human_error})
            else:
                print(f"  Network Simulator Output: {final_action_for_game} (Delivered to Game)")
                log_collector.log_event(NETWORK_CONDITION_EVENT, {"packet_status": "delivered", "data": final_action_for_game})
        else:
            # Still need to process any queued network packets even if no new action from human error layer
            final_action_for_game = network_simulator.simulate_network_conditions(None)
            if final_action_for_game:
                print(f"  Network Simulator Output: {final_action_for_game} (Delivered from queue to Game)")
                log_collector.log_event(NETWORK_CONDITION_EVENT, {"packet_status": "delivered_from_queue", "data": final_action_for_game})

        # Simulate game processing time
        time.sleep(0.05)

    # Simulate some replay data
    mock_replay_data = f"Replay data for session {session_id}. This would be actual game state history."
    log_collector.save_replay_data(mock_replay_data)

    log_collector.end_session() # End the logging session
    print("\n--- Mock Simulation Arena Finished ---")

if __name__ == '__main__':
    run_mock_simulation()