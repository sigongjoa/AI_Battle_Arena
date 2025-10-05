import os
import argparse
import uuid
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.common.callbacks import CheckpointCallback

# Import the new WebRTC-based FightingEnv
from src.fighting_env import FightingEnv

# --- Configuration ---
LOG_DIR = "./logs/ppo_fighting_env_webrtc"
MODEL_DIR = "./models/ppo_fighting_env_webrtc"
TOTAL_TIMESTEPS = 1000000
STEPS_PER_UPDATE = 2048
CHECKPOINT_FREQ = 20000 # Save a checkpoint every 20,000 steps

def main(backend_peer_id: str):
    """
    Main training loop for the single RL agent over WebRTC.
    """
    print(f"--- RL Training over WebRTC ---")
    print(f"Backend Peer ID: {backend_peer_id}")
    print(f"Please connect the frontend to this Peer ID.")
    print(f"Logs will be saved in: {LOG_DIR}")
    print(f"Models will be saved in: {MODEL_DIR}")
    print("---------------------------------")

    # Create directories if they don't exist
    os.makedirs(LOG_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)

    # The environment creation is wrapped in a function for DummyVecEnv
    # This is where the script will wait for the frontend to connect
    try:
        env_fn = lambda: FightingEnv(backend_peer_id=backend_peer_id)
        vec_env = DummyVecEnv([env_fn])
    except Exception as e:
        print(f"Error initializing environment: {e}")
        return

    # --- Model and Callbacks ---
    model = PPO(
        "MlpPolicy",
        vec_env,
        verbose=1,
        tensorboard_log=LOG_DIR,
        device="auto",
        n_steps=STEPS_PER_UPDATE,
        batch_size=64,
    )

    checkpoint_callback = CheckpointCallback(
        save_freq=CHECKPOINT_FREQ,
        save_path=MODEL_DIR,
        name_prefix="ppo_webrtc"
    )

    print(f"Starting training for {TOTAL_TIMESTEPS} timesteps...")
    
    try:
        # Train the model
        model.learn(
            total_timesteps=TOTAL_TIMESTEPS,
            callback=checkpoint_callback
        )
    except Exception as e:
        print(f"An error occurred during training: {e}")
    finally:
        print("Training finished or interrupted. Saving final model...")
        model.save(os.path.join(MODEL_DIR, "ppo_webrtc_final"))
        
        print("Closing environment...")
        vec_env.close()
        print("Environment closed. Exiting.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train an RL agent over WebRTC.")
    parser.add_argument(
        "--peer_id",
        type=str,
        help="The Peer ID for the backend to register with the signaling server."
    )
    args = parser.parse_args()

    if args.peer_id:
        peer_id_to_use = args.peer_id
    else:
        # Generate a random peer id if not provided
        peer_id_to_use = f"rl-backend-{uuid.uuid4().hex[:6]}"

    main(backend_peer_id=peer_id_to_use)
