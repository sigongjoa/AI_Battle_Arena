from unittest.mock import patch, MagicMock

import gymnasium as gym
import numpy as np
import pygame
import pytest

from src.constants import (INITIAL_HEALTH, PLAYER_HEIGHT, PLAYER_WIDTH,
                           SCREEN_HEIGHT, SCREEN_WIDTH)
from src.fighting_env import FightingEnv

# Pygame initialization is now handled by conftest.py fixture


@pytest.fixture
def fighting_env():
    pygame.init()
    pygame.font.init()
    pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.HIDDEN)
    env = FightingEnv(backend_peer_id="test_peer_id", test_mode=True)
    yield env
    env.close()
    pygame.font.quit()
    pygame.quit()


import queue # Import queue for direct mocking

class TestFightingEnvIntegration:
    @pytest.fixture(autouse=True)
    def setup_method(self, mocker):
        # Mock queue.Queue directly
        self.mock_queue_instance = mocker.MagicMock(spec=queue.Queue)
        self.mock_queue_instance.get.return_value = {"type": "connection_ready"}
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
        expected_shape = (16,)
        assert self.env.observation_space.shape == expected_shape

    def test_enriched_observation_flow(self):
        mock_base_obs = np.array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], dtype=np.float32)
        mock_p1_action_str = "light_punch"
        mock_p2_action_str = "guard"
        mock_current_frame = 100

        # Set the specific side_effect for this test's step call
        # The first call to get() (for connection_ready) is already handled by setup_method
        self.mock_queue_instance.get.side_effect = [
            {
                "type": "step_result",
                "observation": mock_base_obs.tolist(),
                "reward": 0.1,
                "done": False,
                "p1_action_str": mock_p1_action_str,
                "p2_action_str": mock_p2_action_str,
                "current_frame": mock_current_frame,
            }
        ]

        obs, reward, terminated, truncated, info = self.env.step(0)

        assert obs.shape == (16,)
        assert np.allclose(obs[:8], mock_base_obs)

        p1_rhythm_vec = self.env.player1_rhythm_analyzer.get_feature_vector()
        p2_rhythm_vec = self.env.player2_rhythm_analyzer.get_feature_vector()

        assert np.allclose(obs[8:12], p1_rhythm_vec)
        assert np.allclose(obs[12:], p2_rhythm_vec)

        assert not np.allclose(p1_rhythm_vec, np.zeros_like(p1_rhythm_vec))
        assert not np.allclose(p2_rhythm_vec, np.zeros_like(p2_rhythm_vec))

def test_env_init(fighting_env):
    assert isinstance(fighting_env, gym.Env)
    assert isinstance(fighting_env.observation_space, gym.spaces.Box)
    assert fighting_env.action_space.n == 6

    # Check observation space bounds
    obs_low = fighting_env.observation_space.low
    obs_high = fighting_env.observation_space.high
    assert np.allclose(obs_low, [0.0]*16)
    assert np.allclose(obs_high, [1.0]*16)


def test_reset(fighting_env):
    obs, info = fighting_env.reset()
    assert isinstance(obs, np.ndarray)
    assert obs.shape == fighting_env.observation_space.shape


def test_env_step_idle_action(fighting_env):
    obs, info = fighting_env.reset()
    next_obs, reward, terminated, truncated, info = fighting_env.step(0)

    assert isinstance(next_obs, np.ndarray)
    assert reward == 0
    assert not terminated


def test_env_step_attack_action(fighting_env):
    obs, info = fighting_env.reset()
    next_obs, reward, terminated, truncated, info = fighting_env.step(4)

    assert isinstance(next_obs, np.ndarray)
    assert reward == 0
    assert not terminated


def test_env_step_ko_victory(fighting_env):
    obs, info = fighting_env.reset()
    next_obs, reward, terminated, truncated, info = fighting_env.step(4)

    assert isinstance(next_obs, np.ndarray)
    assert reward == 0
    assert not terminated


def test_env_step_ko_defeat(fighting_env):
    obs, info = fighting_env.reset()
    next_obs, reward, terminated, truncated, info = fighting_env.step(0)

    assert isinstance(next_obs, np.ndarray)
    assert reward == 0
    assert not terminated
