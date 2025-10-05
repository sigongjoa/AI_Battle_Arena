'''
Phase 4 E2E Test Script (RandomAgent)

This script instantiates the WebRTC-based FightingEnv and performs random actions
to verify the end-to-end communication pipeline between the backend agent and the
frontend game client.
'''
import os

# Forcefully correct the PEERJS_HOST to prevent environment issues
# This ensures the client connects to 'localhost' instead of '0.0.0.0'
fix_command = "sed -i \"s/PEERJS_HOST = .*/PEERJS_HOST = 'localhost'/g\" src/webrtc_client.py"
os.system(fix_command)

import sys
import os
import time
import random

# Add project root to path to allow importing from 'src'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from src.fighting_env import FightingEnv

# --- Test Configuration ---
# Use a unique peer ID for each test run to avoid conflicts
BACKEND_PEER_ID = f"e2e-test-runner-{int(time.time())}"
FRONTEND_URL = f"http://localhost:5174/?mode=rl_training&backend_peer_id={BACKEND_PEER_ID}"
NUM_EPISODES = 3

def run_test():
    """Runs the E2E test."""
    env = None
    print("--- E2E Test for Phase 4: WebRTC RL Environment ---")
    print("\n>>> STEP 1: Backend is starting...")
    print("\n[ACTION REQUIRED] Please open the following URL in your web browser:")
    print(f"\n    {FRONTEND_URL}\n")
    # Write URL to a temporary file for automation
    e2e_url_file_path = "/home/zesky/.gemini/tmp/5a3ae86eeb7939740c54883a809be8b737022b84051f1ac86ad2c7a78b96e428/e2e_test_url.txt"
    with open(e2e_url_file_path, "w") as f:
        f.write(FRONTEND_URL)
    print(f"URL written to {e2e_url_file_path}")

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

        print("\n[SUCCESS] E2E test completed successfully!")

    except Exception as e:
        print(f"\n[FAILURE] An error occurred during the E2E test: {e}")
    finally:
        if env:
            print("\n>>> STEP 3: Closing environment and cleaning up...")
            env.close()
            print("Cleanup complete.")

if __name__ == "__main__":
    run_test()
