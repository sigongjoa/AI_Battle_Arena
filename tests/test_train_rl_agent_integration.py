import pytest
import os
import shutil
from unittest.mock import MagicMock, patch
import numpy as np
import queue
import itertools

import src.networking.webrtc # Import webrtc
import src.rl_training.environment # Import environment to patch its internal WebRTCClient
from stable_baselines3.common.monitor import Monitor, ResultsWriter # Import Monitor to mock it

# Import the function to be tested
from scripts.train import train_agent
from src.rl_training.wrappers import FlattenActionSpaceWrapper # Import the custom wrapper

# Define paths for test logs and models
TEST_LOG_DIR = "./test_logs/ppo_fighting_env_multi_agent"
TEST_MODEL_DIR = "./test_models/ppo_fighting_env_multi_agent"

@pytest.fixture(autouse=True)
def cleanup_test_dirs():
    # Clean up test directories before each test
    if os.path.exists(TEST_LOG_DIR):
        shutil.rmtree(TEST_LOG_DIR)
    if os.path.exists(TEST_MODEL_DIR):
        shutil.rmtree(TEST_MODEL_DIR)
    os.makedirs(TEST_LOG_DIR, exist_ok=True)
    os.makedirs(TEST_MODEL_DIR, exist_ok=True)
    yield
    # Clean up after each test
    if os.path.exists(TEST_LOG_DIR):
        shutil.rmtree(TEST_LOG_DIR)
    if os.path.exists(TEST_MODEL_DIR):
        shutil.rmtree(TEST_MODEL_DIR)



def test_train_agent_runs_successfully(mocker):
    mocker.patch("src.fighting_env.FightingEnv.step", side_effect=itertools.cycle([
        (np.zeros(8, dtype=np.float32), 0.1 + i * 0.01, True, False, {}) for i in range(10)
    ]))
    mocker.patch("src.fighting_env.FightingEnv.reset", return_value=(
        np.zeros(8, dtype=np.float32), # observation
        {} # info
    ))
    mocker.patch("src.fighting_env.WebRTCClient.__init__", return_value=None)
    mocker.patch("src.fighting_env.WebRTCClient.run", return_value=None)
    mocker.patch("src.fighting_env.WebRTCClient.close", return_value=None)

    mock_action_queue_train = mocker.MagicMock(spec=queue.Queue)
    mock_result_queue_train = mocker.MagicMock(spec=queue.Queue)
    mock_result_queue_train.get.side_effect = itertools.chain(
        [
            {"type": "connection_ready"},
        ],
        itertools.cycle([
            {"type": "action_result", "state": {
                "observation": np.zeros(8, dtype=np.float32).tolist(),
                "p1_health": 90, "p2_health": 90,
                "p1_pos_x": 0, "p2_pos_x": 10,
                "round_over": False
            }}
        ])
    )

    mock_action_queue_eval = mocker.MagicMock(spec=queue.Queue)
    mock_result_queue_eval = mocker.MagicMock(spec=queue.Queue)
    mock_result_queue_eval.get.side_effect = itertools.chain(
        [
            {"type": "connection_ready"},
        ],
        itertools.cycle([
            {"type": "action_result", "state": {
                "observation": np.zeros(8, dtype=np.float32).tolist(),
                "p1_health": 90, "p2_health": 90,
                "p1_pos_x": 0, "p2_pos_x": 10,
                "round_over": False
            }}
        ])
    )
    mocker.patch('queue.Queue', side_effect=[mock_action_queue_train, mock_result_queue_train, mock_action_queue_eval, mock_result_queue_eval])
    # Temporarily override LOG_DIR and MODEL_DIR for testing
    mocker.patch('train_rl_agent.LOG_DIR', TEST_LOG_DIR)
    mocker.patch('train_rl_agent.MODEL_DIR', TEST_MODEL_DIR)
    mocker.patch('train_rl_agent.BEST_MODEL_SAVE_PATH', os.path.join(TEST_MODEL_DIR, "best_model"))

    # Ensure config.yaml is loaded correctly for the test
    mocker.patch('train_rl_agent.config', {
        'rl_training': {
            'active_policy': 'PPO',
            'policies': {
                'PPO': {
                    'algorithm': 'PPO',
                    'hyperparameters': {
                        'learning_rate': 0.0003,
                                                    'n_steps': 2,                        'batch_size': 4,
                        'gamma': 0.99,
                        'gae_lambda': 0.95,
                        'clip_range': 0.2,
                        'ent_coef': 0.01,
                        'vf_coef': 0.5,
                        'max_grad_norm': 0.5,
                            'n_epochs': 1,
                            'device': 'cpu',
                            'verbose': 2                    }
                }
            }
        },
        'training_config': {
                            'total_timesteps': 10,            'eval_freq': 1,
            'n_eval_episodes': 1,
            'n_envs': 1
        }
    })
    mocker.patch('train_rl_agent.training_config', {
        'total_timesteps': 10,
        'eval_freq': 1,
        'n_eval_episodes': 1,
        'n_envs': 1
    })
    # Run the training agent for a small number of timesteps
    try:
        train_agent(seed=42)
    except Exception as e:
        pytest.fail(f"train_agent raised an exception: {e}")

    # Assert that the final model was saved
    final_model_path = os.path.join(TEST_MODEL_DIR, "ppo_final_model.zip")
    assert os.path.exists(final_model_path)

    # Assert that the best model was saved (due to EvalCallback)
    best_model_path = os.path.join(TEST_MODEL_DIR, "best_model")
    assert os.path.exists(best_model_path)

    # Assert that some logs were created
    assert os.path.exists(TEST_LOG_DIR)
    assert len(os.listdir(TEST_LOG_DIR)) > 0

    # Verify that WebRTCClient methods were called as expected

