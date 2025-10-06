import subprocess
import time
import os
import sys

# Add project root to path to allow importing from 'src'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

# Fixed URL for the E2E test
E2E_TEST_URL = "http://localhost:5174/?mode=rl_training&backend_peer_id=e2e-test-runner-fixed"
E2E_RESULT_FILE = "/home/zesky/.gemini/tmp/5a3ae86eeb7939740c54883a809be8b737022b84051f1ac86ad2c7a78b96e428/e2e_test_result.txt"

def run_automation():
    # Clean up previous result file if it exists
    if os.path.exists(E2E_RESULT_FILE):
        os.remove(E2E_RESULT_FILE)

    print("--- Starting E2E Test Automation ---")

    # Step 1: Start run_e2e_test.py in the background
    print(f"Starting run_e2e_test.py in background...")
    # Use the venv python interpreter
    process = subprocess.Popen(["venv/bin/python", "run_e2e_test.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(f"run_e2e_test.py started with PID: {process.pid}")

    # Step 2: Navigate the browser to the fixed URL
    # This part needs to be executed by the agent's navigate_page tool
    print(f"Please navigate the browser to: {E2E_TEST_URL}")
    print("Waiting for agent to navigate browser...")
    # In a real scenario, the agent would call navigate_page here.
    # For this script, we assume the agent will handle navigation externally.

    # Step 3: Poll the result file until it contains content
    print(f"Polling for result file: {E2E_RESULT_FILE}")
    timeout_seconds = 90 # Give it more time than the 60s internal timeout
    start_time = time.time()
    while not os.path.exists(E2E_RESULT_FILE) or os.path.getsize(E2E_RESULT_FILE) == 0:
        if time.time() - start_time > timeout_seconds:
            print(f"Timeout: Result file not written within {timeout_seconds} seconds.")
            process.terminate() # Terminate the background process
            print("Terminated run_e2e_test.py process.")
            return "[FAILURE] Automation timed out waiting for result file."
        time.sleep(1) # Check every second
    
    # Step 4: Read the content of the result file
    with open(E2E_RESULT_FILE, "r") as f:
        result = f.read()
    
    print("\n--- E2E Test Automation Complete ---")
    print("Result from run_e2e_test.py:")
    print(result)

    # Ensure the background process is terminated if it's still running
    if process.poll() is None:
        process.terminate()
        print("Terminated run_e2e_test.py process after getting result.")

    return result

if __name__ == "__main__":
    run_automation()
