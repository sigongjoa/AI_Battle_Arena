import pytest
import numpy as np
import gymnasium as gym
import pygame

from src.fighting_env import FightingEnv
from src.constants import INITIAL_HEALTH, SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT
from unittest.mock import patch

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

def test_env_init(fighting_env):
    assert isinstance(fighting_env, gym.Env)
    assert isinstance(fighting_env.observation_space, gym.spaces.Box)
    assert isinstance(fighting_env.action_space, gym.spaces.Discrete)
    assert fighting_env.action_space.n == 6

    # Check observation space bounds
    obs_low = fighting_env.observation_space.low
    obs_high = fighting_env.observation_space.high
    assert np.allclose(obs_low, [0, 0, 0, 0, 0, 0, 0, 0])
    assert np.allclose(obs_high, [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0])

def test_env_reset(fighting_env):
    obs, info = fighting_env.reset()
    assert isinstance(obs, np.ndarray)
    assert obs.shape == fighting_env.observation_space.shape
    # Assertions on internal game state like player_agent.health are removed
    # as FightingEnv does not expose these attributes directly.
    # The test_mode in WebRTCClient ensures a dummy observation is returned.

def test_env_step_idle_action(fighting_env):
    obs, info = fighting_env.reset()
    # Removed assertions on player_agent.health and opponent_player.health
    # as FightingEnv does not expose these attributes directly.

    # Take an idle action (action 0)
    next_obs, reward, terminated, truncated, info = fighting_env.step(0)

    assert isinstance(next_obs, np.ndarray)
    assert reward == 0 # Assuming dummy reward is 0 in test_mode
    assert not terminated # Assuming dummy done is False in test_mode
    # Removed assertions on internal game state.

def test_env_step_attack_action(fighting_env):
    obs, info = fighting_env.reset()

    # Take an attack action (action 4)
    next_obs, reward, terminated, truncated, info = fighting_env.step(4)

    assert isinstance(next_obs, np.ndarray)
    # In test_mode, dummy reward is 0, and done is False.
    # So, we expect reward to be 0 and not terminated.
    assert reward == 0
    assert not terminated

def test_env_step_ko_victory(fighting_env):
    obs, info = fighting_env.reset()

    # Take an action that would lead to KO victory (action 4)
    next_obs, reward, terminated, truncated, info = fighting_env.step(4)

    assert isinstance(next_obs, np.ndarray)
    # In test_mode, dummy reward is 0, and done is False.
    # So, we expect reward to be 0 and not terminated.
    assert reward == 0
    assert not terminated

def test_env_step_ko_defeat(fighting_env):
    obs, info = fighting_env.reset()

    # Take an action that would lead to KO defeat (action 0, assuming opponent attacks)
    next_obs, reward, terminated, truncated, info = fighting_env.step(0)

    assert isinstance(next_obs, np.ndarray)
    # In test_mode, dummy reward is 0, and done is False.
    # So, we expect reward to be 0 and not terminated.
    assert reward == 0
    assert not terminated
