import gymnasium as gym
import numpy as np
import os
import time
import yaml # Import yaml
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.callbacks import EvalCallback, StopTrainingOnRewardThreshold
from stable_baselines3.common.monitor import Monitor

from src.fighting_env import FightingEnv
from src.simulation.simulation_manager import SimulationManager
from src.rl_policy_manager import PolicyManager # Import PolicyManager

# Configuration
LOG_DIR = "./logs/ppo_fighting_env_multi_agent"
MODEL_DIR = "./models/ppo_fighting_env_multi_agent"
BEST_MODEL_SAVE_PATH = os.path.join(MODEL_DIR, "best_model")
CONFIG_PATH = "./config.yaml" # Path to the configuration file

# Ensure directories exist
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# Load configuration
with open(CONFIG_PATH, 'r') as f:
    config = yaml.safe_load(f)

rl_training_config = config['rl_training']
training_config = config['training_config']

def train_agent(total_timesteps: int = None, seed: int = None, backend_peer_id: str = "backend_peer_id_for_train"):
    # Use total_timesteps from config if not provided as argument
    if total_timesteps is None:
        total_timesteps = training_config['total_timesteps']

    # Initialize SimulationManager for consistent seeding and logging
    sim_manager = SimulationManager(seed=seed)
    sim_manager.start_logging(LOG_DIR)

    # Create training environment
    # Monitor wrapper is important for EvalCallback to log episode stats
    env = Monitor(FightingEnv(backend_peer_id=backend_peer_id), LOG_DIR)
    # Vectorized environments are often used for faster training
    vec_env = make_vec_env(lambda: env, n_envs=training_config['n_envs']) # Use n_envs from config

    # Create evaluation environment
    eval_env = Monitor(FightingEnv(backend_peer_id=backend_peer_id), LOG_DIR)

    # Callback for evaluating and saving the best model
    # Stop training if the mean reward reaches a certain threshold
    # callback_on_best = StopTrainingOnRewardThreshold(reward_threshold=training_config.get('reward_threshold', -float('inf')), verbose=1) # Use reward_threshold from config
    eval_callback = EvalCallback(eval_env, 
                                 best_model_save_path=BEST_MODEL_SAVE_PATH,
                                 log_path=LOG_DIR, 
                                 eval_freq=training_config['eval_freq'], # Use eval_freq from config
                                 deterministic=True, 
                                 render=False, # Set to True to see evaluation runs
                                 n_eval_episodes=training_config['n_eval_episodes'], # Use n_eval_episodes from config
                                 # callback_on_new_best=callback_on_best,
                                 verbose=1)

    # Initialize PolicyManager and create the RL model
    active_policy_name = rl_training_config['active_policy']
    policy_config = rl_training_config['policies'][active_policy_name]['hyperparameters']
    
    policy_manager = PolicyManager(active_policy_name, vec_env, policy_config, seed=sim_manager.seed_value)
    model = policy_manager.get_current_policy()

    print(f"Starting training for {total_timesteps} timesteps using {active_policy_name} policy...")
    try:
        model.learn(total_timesteps=total_timesteps, callback=eval_callback)
    except KeyboardInterrupt:
        print("Training interrupted by user.")

    # Save the final model
    final_model_path = os.path.join(MODEL_DIR, f"{active_policy_name.lower()}_final_model.zip")
    model.save(final_model_path)
    print(f"Final model saved to {final_model_path}")
