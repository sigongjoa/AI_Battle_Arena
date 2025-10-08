import random
import time
from collections import deque
from src.utils.config_loader import load_config

class NetworkSimulator:
    def __init__(self):
        self.config = load_config().get('simulation', {}).get('network', {})
        self.latency_mean = self.config.get('latency_mean', 0)
        self.latency_std = self.config.get('latency_std', 0)
        self.packet_loss_probability = self.config.get('packet_loss_probability', 0.0)

        self.packet_queue = deque()
        self.next_delivery_time = 0

    def simulate_network_conditions(self, data):
        """
        Simulates network conditions (latency, packet loss) for data packets.
        Returns the data if delivered, None if lost or still in transit.
        """
        # Simulate packet loss
        if random.random() < self.packet_loss_probability:
            # print(f"  [NetworkSimulator] Packet lost: {data}")
            return None

        # Simulate latency
        if not self.packet_queue:
            # Calculate latency for this packet
            latency_ms = max(0, int(random.gauss(self.latency_mean, self.latency_std)))
            self.next_delivery_time = time.time() + (latency_ms / 1000.0)
            self.packet_queue.append(data)
            # print(f"  [NetworkSimulator] Packet '{data}' received, will be delivered in {latency_ms}ms.")
            return None # Not delivered yet

        if time.time() < self.next_delivery_time:
            # print(f"  [NetworkSimulator] Packet '{self.packet_queue[0]}' still in transit.")
            return None # Still in transit

        # Packet delivered
        delivered_data = self.packet_queue.popleft()
        # print(f"  [NetworkSimulator] Packet delivered: {delivered_data}")
        return delivered_data

# Simple test function for network_simulator
def test_network_simulator():
    print("--- Testing NetworkSimulator ---")
    net_sim = NetworkSimulator()

    # Override config for predictable testing
    net_sim.latency_mean = 100 # ms
    net_sim.latency_std = 10 # ms
    net_sim.packet_loss_probability = 0.1

    messages = ["action_1", "action_2", "action_3", "action_4"]
    
    print(f"Config: mean_latency={net_sim.latency_mean}ms, packet_loss_prob={net_sim.packet_loss_probability}")

    delivered_count = 0
    for i in range(20): # Simulate 20 frames/time steps
        current_message = messages[i % len(messages)]
        print(f"\nTime Step {i+1}: Sending message '{current_message}'")
        
        # Simulate sending a message
        output_message = net_sim.simulate_network_conditions(current_message)
        
        # Also check for previously queued messages
        while net_sim.packet_queue and time.time() >= net_sim.next_delivery_time:
            output_message = net_sim.simulate_network_conditions(None) # Pass None to just check queue
            if output_message:
                print(f"  Output (from queue): {output_message}")
                delivered_count += 1
        
        if output_message and output_message is not current_message: # If it's a newly delivered message
             print(f"  Output: {output_message}")
             delivered_count += 1
        elif output_message is None:
            print("  Output: None (lost or in transit)")
        
        time.sleep(0.05) # Simulate some time passing between frames

    print(f"\nTotal messages delivered: {delivered_count}")

if __name__ == '__main__':
    test_network_simulator()