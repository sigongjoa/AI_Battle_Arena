import os
import gym
import numpy as np
from stable_baselines3 import PPO
from stable_baselines3.common.buffers import RolloutBuffer
from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.common.callbacks import CheckpointCallback, BaseCallback
from stable_baselines3.common.logger import HParam
from stable_baselines3.common.utils import obs_as_tensor, safe_mean
import torch

from src.fighting_env import FightingEnv
from src.constants import FPS # Assuming FPS is defined in constants.py
from src.callbacks import CustomTensorboardCallback # This callback needs to be adapted for multi-agent

# Custom Wrapper to unpack MultiDiscrete action for FightingEnv
class MultiDiscreteUnpackWrapper(gym.Wrapper):
    def __init__(self, env):
        super().__init__(env)
        self.action_space = self.env.action_space # Keep MultiDiscrete action space

    def step(self, action):
        # SB3 DummyVecEnv가 sometimes numpy.int64로 전달할 수 있음
        if isinstance(action, (int, np.integer)):
            # fallback: 두 에이전트 모두 같은 행동으로 복제
            action = [action, action]

        # SB3는 (n_envs, action_dim) 형태로 전달할 때도 있음
        if isinstance(action, np.ndarray):
            if action.ndim == 2:  # shape (1,2)
                action = action[0]
            action = action.tolist()

        action_p1, action_p2 = action
        return self.env.step((int(action_p1), int(action_p2)))

    def reset(self, **kwargs):
        return self.env.reset(**kwargs)

# Configuration
LOG_DIR = "./logs/ppo_fighting_env_multi_agent"
MODEL_DIR = "./models/ppo_fighting_env_multi_agent"
TOTAL_TIMESTEPS = 1000 # Further reduced for quick testing
N_STEPS_PER_UPDATE = 10 # Number of steps to collect before each policy update (further reduced)

# Create directories if they don't exist
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# Custom Multi-Agent Tensorboard Callback (adapted from CustomTensorboardCallback)
class MultiAgentTensorboardCallback(BaseCallback):
    def __init__(self, verbose: int = 0):
        super().__init__(verbose)
        self.ep_info_buffer = [] # For combined reward

    def _on_step(self) -> bool:
        # This callback is called after each step of the environment
        # We need to check if an episode has ended
        dones = self.locals["dones"]
        infos = self.locals["infos"]
        rewards = self.locals["rewards"]

        # Assuming single environment for now, so dones[0] is a boolean
        # rewards[0] is the combined reward (reward_p1 - reward_p2)
        # infos[0] is the combined info dict

        if dones[0]: # If episode is done
            # The reward here is the combined reward from env.step()
            combined_reward = rewards[0]
            # The info dict contains player1_info and player2_info, and also 'episode' key from SB3 wrapper
            info_p1 = infos[0].get("player1_info", {})
            info_p2 = infos[0].get("player2_info", {})
            episode_length = infos[0].get("episode", {}).get("l", 0) # Get episode length from info

            self.ep_info_buffer.append({"r": combined_reward, "l": episode_length})
            self.logger.record("custom/combined_episode_reward", combined_reward)
            self.logger.record("custom/episode_length", episode_length)
            self.logger.record("custom/p1_won", 1 if info_p1.get("player_won", False) else 0)
            self.logger.record("custom/p2_won", 1 if info_p2.get("player_won", False) else 0)

        return True


if __name__ == "__main__":
    print("Initializing FightingEnv for Multi-Agent Training (Centralized Policy)...")
    # Create a single environment instance for training
    env = FightingEnv(seed=42) 
    # Wrap FightingEnv with MultiDiscreteUnpackWrapper
    wrapped_env = MultiDiscreteUnpackWrapper(env)
    # Stable-Baselines3 expects a VecEnv, so wrap it
    vec_env = DummyVecEnv([lambda: wrapped_env])

    print("Environment created. Observation space:", vec_env.observation_space.shape)
    print("Action space:", vec_env.action_space) # Now a MultiDiscrete space

    # Start custom logging via SimulationManager (for training env)
    env.simulation_manager.start_logging(experiment_name="ppo_training_centralized")

    # Initialize a single PPO model for centralized multi-agent control
    model = PPO("MlpPolicy", vec_env, verbose=1, tensorboard_log=LOG_DIR, device="auto", 
                   n_steps=N_STEPS_PER_UPDATE, batch_size=N_STEPS_PER_UPDATE//4) # Adjust batch_size

    # Setup callbacks
    checkpoint_callback = CheckpointCallback(save_freq=N_STEPS_PER_UPDATE, save_path=MODEL_DIR, name_prefix="ppo_centralized")
    multi_agent_tensorboard_callback = MultiAgentTensorboardCallback()

    print(f"Starting centralized multi-agent training for {TOTAL_TIMESTEPS} timesteps...")
    
    # Train the model with all callbacks
    model.learn(total_timesteps=TOTAL_TIMESTEPS, callback=[checkpoint_callback, multi_agent_tensorboard_callback])

    print("Training finished. Saving final model...")
    model.save(os.path.join(MODEL_DIR, "ppo_centralized_final"))

    print("Model saved. Testing trained agent...")

    # Test the trained agent
    obs = vec_env.reset()
    episode_combined_reward = 0
    episode_steps = 0
    episode_num = 0

    for i in range(1): # Run for 1 step for testing
        actions_array, _states = model.predict(obs, deterministic=True)
        
        print(f"DEBUG: actions_array from model.predict: {actions_array}, type: {type(actions_array)}, shape: {actions_array.shape}")
        print(f"DEBUG: actions_array[0]: {actions_array[0]}, type: {type(actions_array[0])}")

        # actions_array will be a numpy array like [[action_p1, action_p2]] for MultiDiscrete and n_envs=1
        # We need to extract the inner array and convert it to a tuple
        actions_tuple = tuple(actions_array[0]) # This should be (action_p1, action_p2)
        print(f"DEBUG: actions_tuple: {actions_tuple}, type: {type(actions_tuple)}")

        obs, combined_reward, done, info = vec_env.step([actions_tuple]) # Step with tuple of actions

        episode_combined_reward += combined_reward
        episode_steps += 1

        if done: # Episode ends if either player is done
            episode_num += 1
            log_entry = {
                "episode": episode_num,
                "total_combined_reward": episode_combined_reward,
                "steps": episode_steps,
                "player1_won": info[0].get("player1_info", {}).get("player_won", False),
                "player2_won": info[0].get("player2_info", {}).get("player_won", False)
            }
            env.simulation_manager.log_episode_data(log_entry)
            print(f"Episode {episode_num} finished after {episode_steps} steps. Combined Reward: {episode_combined_reward:.2f}, P1 Won: {info[0].get("player1_info", {}).get("player_won", False)}")
            obs = vec_env.reset()
            episode_combined_reward = 0
            episode_steps = 0

    vec_env.close()
    print("Testing complete.")