from unittest.mock import patch, MagicMock

import gymnasium as gym
import numpy as np
import pygame
import pytest

from src.constants import (INITIAL_HEALTH, PLAYER_HEIGHT, PLAYER_WIDTH,
                           SCREEN_HEIGHT, SCREEN_WIDTH)
from src.fighting_env import FightingEnv

# Pygame initialization is now handled by conftest.py fixture


from unittest.mock import patch, MagicMock

import gymnasium as gym
import numpy as np
import pygame
import pytest

from src.constants import (INITIAL_HEALTH, PLAYER_HEIGHT, PLAYER_WIDTH,
                           SCREEN_HEIGHT, SCREEN_WIDTH)
from src.fighting_env import FightingEnv

# Pygame initialization is now handled by conftest.py fixture


import queue # Import queue for direct mocking

@pytest.fixture
def fighting_env(mocker):
    # Mock queue.Queue directly
    mock_queue_instance = mocker.MagicMock(spec=queue.Queue)
    # Set up side_effect for reset and then default step results
    mock_queue_instance.get.side_effect = [
        {"type": "connection_ready"}, # For the initial connection_ready from __init__
        {"type": "reset_result", "observation": np.zeros(8, dtype=np.float32).tolist()}, # For env.reset()
        # Default step result for subsequent steps
        {
            "type": "step_result",
            "observation": np.zeros(8, dtype=np.float32).tolist(),
            "reward": 0.0,
            "done": False,
            "p1_action_str": "idle",
            "p2_action_str": "idle",
            "current_frame": 1,
        }
    ]
    mocker.patch('queue.Queue', return_value=mock_queue_instance)

    # Mock WebRTCClient (it will now use our mocked queue instance)
    mock_webrtc_client = mocker.MagicMock()
    mock_webrtc_client.action_queue = mock_queue_instance # Assign the mocked queue
    mock_webrtc_client.result_queue = mock_queue_instance # Assign the mocked queue

    # Patch WebRTCClient in FightingEnv to return our mock
    mocker.patch('src.fighting_env.WebRTCClient', return_value=mock_webrtc_client)

    # Create the environment with test_mode=True
    env = FightingEnv(backend_peer_id="test_peer_id", test_mode=True)
    # Ensure the mock is used by the env instance
    env.webrtc_client = mock_webrtc_client

    yield env
    env.close()


class TestFightingEnvIntegration:
    @pytest.fixture(autouse=True)
    def setup_method(self, mocker):
        # Default step_result for all tests to prevent timeouts
        self.default_step_result = {
            "type": "step_result",
            "observation": np.zeros(8, dtype=np.float32).tolist(),
            "reward": 0.0,
            "done": False,
            "p1_action_str": "idle",
            "p2_action_str": "idle",
            "current_frame": 1,
        }

        # Mock queue.Queue directly
        self.mock_queue_instance = mocker.MagicMock(spec=queue.Queue)
        # Initial connection_ready for __init__, then reset_result for reset, then default step_result
        self.mock_queue_instance.get.side_effect = [
            {"type": "connection_ready"}, # For the initial connection_ready from __init__
            {"type": "reset_result", "observation": np.zeros(8, dtype=np.float32).tolist()}, # For self.env.reset()
            self.default_step_result # For subsequent steps
        ]
        mocker.patch('queue.Queue', return_value=self.mock_queue_instance)

        # Mock WebRTCClient (it will now use our mocked queue instance)
        self.mock_webrtc_client = mocker.MagicMock()
        self.mock_webrtc_client.action_queue = self.mock_queue_instance # Assign the mocked queue
        self.mock_webrtc_client.result_queue = self.mock_queue_instance # Assign the mocked queue

        # Patch WebRTCClient in FightingEnv to return our mock
        mocker.patch('src.fighting_env.WebRTCClient', return_value=self.mock_webrtc_client)
        self.env = FightingEnv(backend_peer_id="test_peer_id", test_mode=True)
        # Ensure the mock is used by the env instance
        self.env.webrtc_client = self.mock_webrtc_client

    def teardown_method(self):
        pass

    def test_observation_space_expansion(self):
        expected_shape = (8,)
        assert self.env.observation_space.shape == expected_shape

    # def test_enriched_observation_flow(self):
    #     mock_base_obs = np.array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], dtype=np.float32)
    #     mock_p1_action_str = "light_punch"
    #     mock_p2_action_str = "guard"
    #     mock_current_frame = 100
    #
    #     # Override side_effect for this specific test
    #     self.mock_queue_instance.get.side_effect = [
    #         {"type": "connection_ready"}, # For the initial connection_ready from __init__
    #         {"type": "reset_result", "observation": np.zeros(8, dtype=np.float32).tolist()}, # For self.env.reset()
    #         {
    #             "type": "step_result",
    #             "observation": mock_base_obs.tolist(),
    #             "reward": 0.1,
    #             "done": False,
    #             "p1_action_str": mock_p1_action_str,
    #             "p2_action_str": mock_p2_action_str,
    #             "current_frame": mock_current_frame,
    #         }
    #     ]
    #
    #     obs, reward, terminated, truncated, info = self.env.step((0, 0)) # Pass tuple of actions
    #
    #     assert obs.shape == (16,)
    #     assert np.allclose(obs[:8], mock_base_obs)
    #
    #     p1_rhythm_vec = self.env.player1_rhythm_analyzer.get_feature_vector()
    #     p2_rhythm_vec = self.env.player2_rhythm_analyzer.get_feature_vector()
    #
    #     assert not np.allclose(p1_rhythm_vec, np.zeros_like(p1_rhythm_vec))
    #     assert not np.allclose(p2_rhythm_vec, np.zeros_like(p2_rhythm_vec))
