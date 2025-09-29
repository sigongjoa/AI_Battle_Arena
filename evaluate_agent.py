import os
import argparse
import numpy as np
from stable_baselines3 import PPO
from typing import Dict, Any, Tuple
import imageio # Import imageio
import pygame # Import pygame to capture screen

from src.fighting_env import FightingEnv

def run_evaluation(
    model: PPO,
    env: FightingEnv,
    num_episodes: int,
    render: bool = False,
    save_gif: bool = False,
    gif_filename: str = "evaluation_results.gif"
) -> Dict[str, Any]:
    """
    주어진 단일 모델과 환경을 사용하여 지정된 수의 에피소드 동안 평가를 실행하고,
    집계된 평가 지표를 반환합니다. GIF 저장 기능이 포함됩니다.
    """
    episode_combined_rewards = []
    episode_lengths = []
    episode_wins_p1 = []
    episode_wins_p2 = []
    
    frames = [] # List to store frames for GIF

    for i in range(num_episodes):
        obs = env.reset()
        done = False
        total_combined_reward = 0
        steps = 0

        while not done:
            actions_array, _states = model.predict(obs, deterministic=True)
            
            # actions_array will be a numpy array like [action_p1, action_p2]
            action_p1 = int(actions_array[0].item()) # Ensure action is an integer
            action_p2 = int(actions_array[1].item()) # Ensure action is an integer

            obs, combined_reward, done, info = env.step((action_p1, action_p2))
            
            total_combined_reward += combined_reward
            steps += 1

            # Episode is done if either player is done


            if render:
                env.render()
                if save_gif:
                    if pygame.display.get_surface() is not None:
                        frame = np.array(pygame.display.get_surface().get_view('3'))
                        frames.append(frame)

        episode_combined_rewards.append(total_combined_reward)
        episode_lengths.append(steps)
        episode_wins_p1.append(1 if info["player1_info"].get("player_won", False) else 0)
        episode_wins_p2.append(1 if info["player2_info"].get("player_won", False) else 0)
        print(f"Evaluation Episode {i+1}/{num_episodes} - Combined Reward: {total_combined_reward:.2f}, Steps: {steps}, P1 Won: {info["player1_info"].get("player_won", False)}")

    env.close()

    if save_gif and len(frames) > 0:
        print(f"Saving GIF to {gif_filename}...")
        imageio.mimsave(gif_filename, frames, fps=env.simulation_manager.fps)
        print("GIF saved.")

    results = {
        "mean_combined_reward": np.mean(episode_combined_rewards),
        "std_combined_reward": np.std(episode_combined_rewards),
        "mean_episode_length": np.mean(episode_lengths),
        "std_episode_length": np.std(episode_lengths),
        "p1_win_rate": np.mean(episode_wins_p1),
        "p2_win_rate": np.mean(episode_wins_p2)
    }

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate trained RL agent in the FightingEnv (Centralized Policy).")
    parser.add_argument("--model_path", type=str, required=True,
                        help="Path to the trained centralized model (e.g., models/ppo_fighting_env_multi_agent/ppo_centralized_final.zip).")
    parser.add_argument("--num_episodes", type=int, default=10,
                        help="Number of episodes to run for evaluation.")
    parser.add_argument("--render", action="store_true",
                        help="Render the environment during evaluation.")
    parser.add_argument("--save_gif", action="store_true",
                        help="Save the evaluation as a GIF.")
    parser.add_argument("--gif_filename", type=str, default="evaluation_results.gif",
                        help="Filename for the saved GIF.")
    parser.add_argument("--seed", type=int, default=44,
                        help="Random seed for the evaluation environment.")

    args = parser.parse_args()

    print(f"Loading centralized model from: {args.model_path}")
    model = PPO.load(args.model_path)

    print(f"Creating evaluation environment with seed: {args.seed}")
    eval_env = FightingEnv(seed=args.seed, headless=not (args.render or args.save_gif))

    print(f"Starting evaluation for {args.num_episodes} episodes...")
    evaluation_results = run_evaluation(model, eval_env, args.num_episodes, args.render, args.save_gif, args.gif_filename)

    print("\n--- Evaluation Results ---")
    for key, value in evaluation_results.items():
        print(f"{key}: {value:.4f}")
