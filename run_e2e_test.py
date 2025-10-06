'''
Phase 4 E2E Test Script (RandomAgent)

This script instantiates the WebRTC-based FightingEnv and performs random actions
to verify the end-to-end communication pipeline between the backend agent and the
frontend game client.
'''
import os



import sys
import os
import time
import random

# Add project root to path to allow importing from 'src'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from src.fighting_env import FightingEnv

# --- Test Configuration ---
# Use a fixed peer ID for E2E test runs
BACKEND_PEER_ID = "e2e-test-runner-fixed"
FRONTEND_URL = f"http://localhost:5174/?mode=rl_training&backend_peer_id={BACKEND_PEER_ID}"
NUM_EPISODES = 3

def run_test():
    """Runs the E2E test."""
    env = None
    print("--- E2E Test for Phase 4: WebRTC RL Environment ---")
    print("\n>>> STEP 1: Backend is starting...")
    print(f"\n[ACTION REQUIRED] Please open the following URL in your web browser:\n\n    {FRONTEND_URL}\n")
    # Removed writing URL to a temporary file as the ID is now fixed.

    try:
        # Initialize the environment. This will block until the frontend connects.
        env = FightingEnv(backend_peer_id=BACKEND_PEER_ID)

        print("\n>>> STEP 2: Frontend connected. Running test episodes...")

        for i in range(NUM_EPISODES):
            print(f"\n--- Episode {i + 1}/{NUM_EPISODES} ---")
            obs, info = env.reset()
            done = False
            step_count = 0
            while not done:
                # Generate a random action
                action = env.action_space.sample()
                
                print(f"  Step {step_count}: Sending action {action}...", end='')
                obs, reward, done, truncated, info = env.step(action)
                print(f" -> Received reward: {reward:.4f}, Done: {done}")
                
                step_count += 1
                if step_count > 500: # Timeout to prevent infinite loops
                    print("  Episode timeout reached!")
                    break
            print(f"--- Episode {i + 1} finished after {step_count} steps. ---")

        result_message = "\n[SUCCESS] E2E test completed successfully!"
        print(result_message)
        with open("/home/zesky/.gemini/tmp/5a3ae86eeb7939740c54883a809be8b737022b84051f1ac86ad2c7a78b96e428/e2e_test_result.txt", "w") as f:
            f.write(result_message)

        with open("/home/zesky/.gemini/tmp/5a3ae86eeb7939740c54883a809be8b737022b84051f1ac86ad2c7a78b96e428/e2e_test_result.txt", "w") as f:
            f.write(result_message)
            f.flush() # Ensure data is written to OS buffer
            os.fsync(f.fileno()) # Ensure OS buffer is written to disk
    finally:
        if env:
            print("\n>>> STEP 3: Closing environment and cleaning up...")
            env.close()
            print("Cleanup complete.")

if __name__ == "__main__":
    run_test()
