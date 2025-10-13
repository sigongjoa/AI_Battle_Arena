import gymnasium as gym
import numpy as np
import os
import argparse
from stable_baselines3 import PPO, A2C
from stable_baselines3.common.monitor import Monitor

from src.fighting_env import FightingEnv
from src.simulation.simulation_manager import SimulationManager
from src.rl_policy_manager import PolicyFactory # To load different policy types

# Configuration
LOG_DIR = "./logs/evaluation"

# Ensure directories exist
os.makedirs(LOG_DIR, exist_ok=True)

def evaluate_agent(
    model_path: str,
    policy_name: str,
    num_episodes: int = 10,
    render: bool = False,
    seed: int = None,
    backend_peer_id: str = "backend_peer_id_for_eval",
    headless: bool = False,
):
    # Initialize SimulationManager for consistent seeding
    sim_manager = SimulationManager(seed=seed)

    # Create evaluation environment
    # Monitor wrapper is important for logging episode stats
    eval_env = Monitor(FightingEnv(backend_peer_id=backend_peer_id, headless_mode=headless), LOG_DIR)

    # Load the model based on policy_name
    if policy_name == "PPO":
        model = PPO.load(model_path, env=eval_env) # Pass env for correct observation/action space
    elif policy_name == "A2C":
        model = A2C.load(model_path, env=eval_env) # Pass env for correct observation/action space
    else:
        raise ValueError(f"Unsupported policy name: {policy_name}")

    print(f"Starting evaluation for {num_episodes} episodes using model: {model_path}")

    episode_rewards = []
    episode_lengths = []
    win_counts = 0

    for i in range(num_episodes):
        obs, info = eval_env.reset(seed=sim_manager.seed_value + i) # Use different seed for each episode
        done = False
        total_reward = 0
        episode_length = 0

        while not done:
            action, _states = model.predict(obs, deterministic=True)
            obs, reward, terminated, truncated, info = eval_env.step(action)
            done = terminated or truncated
            total_reward += reward
            episode_length += 1

            if render:
                eval_env.render()

        episode_rewards.append(total_reward)
        episode_lengths.append(episode_length)
        if info.get("player_won", False): # Assuming info contains player_won key
            win_counts += 1

        print(f"Episode {i+1}: Reward = {total_reward:.2f}, Length = {episode_length}")

    eval_env.close()

    mean_reward = np.mean(episode_rewards)
    std_reward = np.std(episode_rewards)
    mean_length = np.mean(episode_lengths)
    std_length = np.std(episode_lengths)
    win_rate = (win_counts / num_episodes) * 100

    print("\n--- Evaluation Results ---")
    print(f"Mean Reward: {mean_reward:.2f} ± {std_reward:.2f}")
    print(f"Mean Episode Length: {mean_length:.2f} ± {std_length:.2f}")
    print(f"Win Rate: {win_rate:.2f}%")
    print("------------------------")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate a trained RL agent.")
    parser.add_argument("--model_path", type=str, required=True, help="Path to the trained model (e.g., ./models/ppo_final_model.zip).")
    parser.add_argument("--policy_name", type=str, required=True, choices=["PPO", "A2C"], help="Name of the policy used for training (e.g., PPO, A2C).")
    parser.add_argument("--num_episodes", type=int, default=10, help="Number of episodes to run for evaluation.")
    parser.add_argument("--render", action="store_true", help="Render the environment during evaluation.")
    parser.add_argument("--seed", type=int, help="Random seed for reproducibility.")
    parser.add_argument("--backend_peer_id", type=str, default="backend_peer_id_for_eval", help="Peer ID of the backend for WebRTC connection.")
    parser.add_argument("--headless", action="store_true", help="Run the environment in headless mode (without WebRTC frontend).")
    args = parser.parse_args()

    evaluate_agent(
        model_path=args.model_path,
        policy_name=args.policy_name,
        num_episodes=args.num_episodes,
        render=args.render,
        seed=args.seed,
        backend_peer_id=args.backend_peer_id,
        headless=args.headless,
    )
