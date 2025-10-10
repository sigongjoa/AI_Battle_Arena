import gymnasium as gym
import numpy as np
import argparse
import os
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import DummyVecEnv
from typing import Tuple

from src.fighting_env import FightingEnv
from src.simulation.simulation_manager import SimulationManager # Assuming this path

def evaluate_agent(
    model_path: str,
    num_episodes: int = 10,
    render: bool = False,
    seed: int = None,
    backend_peer_id: str = "backend_peer_id_for_eval", # Default for evaluation
):
    # Initialize SimulationManager for consistent seeding
    sim_manager = SimulationManager(seed=seed)

    # Create environment
    # For evaluation, we typically use a single environment
    env = FightingEnv(backend_peer_id=backend_peer_id, render_mode="human" if render else None)
    if seed is not None:
        env.seed(seed)

    # Load the trained model
    print(f"Loading model from {model_path}")
    model = PPO.load(model_path, env=env) # Ensure the model is loaded with the correct environment

    episode_rewards = []
    episode_lengths = []
    win_rates = [] # Assuming player 1 is the agent being evaluated

    print(f"Starting evaluation for {num_episodes} episodes...")
    for i in range(num_episodes):
        obs, info = env.reset()
        done = False
        episode_reward = 0
        episode_length = 0

        while not done:
            # The model expects a single observation, but our env returns a concatenated one
            # We need to ensure the model's predict method can handle this or adapt the observation
            # For now, assuming the model was trained on the same observation space
            action, _states = model.predict(obs, deterministic=True)

            # FightingEnv.step now expects a tuple of two actions (p1_action, p2_action)
            # For evaluation, we can have the trained agent control p1, and p2 can be random or another agent
            # For simplicity, let's make p2 take a random action for now.
            p1_action = action[0] if isinstance(action, tuple) else action # Extract p1 action if tuple
            p2_action = env.action_space[1].sample() # Random action for player 2

            obs, reward, terminated, truncated, info = env.step((p1_action, p2_action))
            done = terminated or truncated
            episode_reward += reward
            episode_length += 1

            if render:
                env.render()

        episode_rewards.append(episode_reward)
        episode_lengths.append(episode_length)
        
        # Assuming info contains 'player1_won' or similar
        if 'player1_won' in info:
            win_rates.append(1 if info['player1_won'] else 0)
        else:
            # If win info is not directly available, infer from health or assume loss
            # This part might need adjustment based on actual info content
            if info['player1_health'] > info['player2_health']:
                win_rates.append(1)
            else:
                win_rates.append(0)

        print(f"Episode {i+1}: Reward = {episode_reward:.2f}, Length = {episode_length}")

    env.close()

    mean_reward = np.mean(episode_rewards)
    std_reward = np.std(episode_rewards)
    mean_length = np.mean(episode_lengths)
    std_length = np.std(episode_lengths)
    mean_win_rate = np.mean(win_rates) if win_rates else 0

    print("\n--- Evaluation Results ---")
    print(f"Mean Reward: {mean_reward:.2f} (Std: {std_reward:.2f})")
    print(f"Mean Episode Length: {mean_length:.2f} (Std: {std_length:.2f})")
    print(f"Win Rate (Player 1): {mean_win_rate:.2%}")
    print("--------------------------")

    return {
        "mean_reward": mean_reward,
        "std_reward": std_reward,
        "mean_episode_length": mean_length,
        "std_episode_length": std_length,
        "mean_win_rate": mean_win_rate,
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate a trained RL agent.")
    parser.add_argument("--model_path", type=str, required=True, help="Path to the trained model (e.g., ppo_model.zip)")
    parser.add_argument("--num_episodes", type=int, default=10, help="Number of episodes to run for evaluation.")
    parser.add_argument("--render", action="store_true", help="Render the environment during evaluation.")
    parser.add_argument("--seed", type=int, help="Random seed for reproducibility.")
    parser.add_argument("--backend_peer_id", type=str, default="backend_peer_id_for_eval", help="Peer ID of the backend for WebRTC connection.")

    args = parser.parse_args()

    evaluate_agent(
        model_path=args.model_path,
        num_episodes=args.num_episodes,
        render=args.render,
        seed=args.seed,
        backend_peer_id=args.backend_peer_id,
    )