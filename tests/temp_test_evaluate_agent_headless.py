import pytest
import os
import sys
from unittest.mock import MagicMock, patch
import numpy as np
import gymnasium as gym

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the evaluate_agent function
from evaluate_agent import evaluate_agent

@pytest.fixture
def mock_ppo_load():
    with patch('stable_baselines3.PPO.load') as mock_load:
        mock_model = MagicMock()
        # Mock the predict method to return a valid action and state
        mock_model.predict.return_value = (np.array([0, 0]), None) # Example action for a Tuple(Discrete(6), Discrete(6)) space
        mock_load.return_value = mock_model
        yield mock_load

@pytest.fixture
def mock_fighting_env_headless():
    # Use spec=True to make the mock behave like a real FightingEnv instance
    with patch('evaluate_agent.FightingEnv', spec=True) as mock_env_class:
        mock_env = mock_env_class.return_value
        # Add action_space and observation_space attributes required by Monitor and PPO.load
        mock_env.action_space = gym.spaces.Tuple((gym.spaces.Discrete(6), gym.spaces.Discrete(6)))
        mock_env.observation_space = gym.spaces.Box(low=0.0, high=1.0, shape=(8,), dtype=np.float32)
        mock_env.reset.return_value = (np.zeros(8), {})
        mock_env.step.return_value = (np.zeros(8), 0.0, False, False, {"player_won": False})
        mock_env.close.return_value = None
        mock_env.wait_for_connection.return_value = None
        yield mock_env_class

def test_evaluate_agent_headless_mode_runs_without_error(mock_ppo_load, mock_fighting_env_headless):
    # Create a dummy model file path
    dummy_model_path = "./models/dummy_model.zip"
    os.makedirs(os.path.dirname(dummy_model_path), exist_ok=True)
    with open(dummy_model_path, "w") as f:
        f.write("dummy content")

    try:
        evaluate_agent(
            model_path=dummy_model_path,
            policy_name="PPO",
            num_episodes=1,
            render=False,
            headless=True,
        )
        # Assert that FightingEnv was called with headless_mode=True
        mock_fighting_env_headless.assert_called_once_with(backend_peer_id=None, headless_mode=True)
        # Assert that reset and step were called
        mock_fighting_env_headless.return_value.reset.assert_called_once()
        mock_fighting_env_headless.return_value.step.assert_called_once()

    finally:
        # Clean up the dummy model file
        if os.path.exists(dummy_model_path):
            os.remove(dummy_model_path)

