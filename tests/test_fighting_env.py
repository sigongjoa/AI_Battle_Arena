import pytest
import numpy as np
import gym
import pygame

from src.fighting_env import FightingEnv
from src.constants import INITIAL_HEALTH, SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT

# Pygame initialization is now handled by conftest.py fixture

@pytest.fixture
def fighting_env():
    pygame.init()
    pygame.font.init()
    pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.HIDDEN)
    env = FightingEnv()
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
    assert np.allclose(obs_low, [0, 0, 0, 0, 0, 0, 0])
    assert np.allclose(obs_high, [INITIAL_HEALTH, INITIAL_HEALTH, SCREEN_WIDTH, SCREEN_WIDTH, SCREEN_HEIGHT, 5, 5])

def test_env_reset(fighting_env):
    obs = fighting_env.reset()
    assert isinstance(obs, np.ndarray)
    assert fighting_env.player_agent.health == INITIAL_HEALTH
    assert fighting_env.opponent_player.health == INITIAL_HEALTH
    assert fighting_env.player_agent.state == "idle"
    assert fighting_env.opponent_player.state == "idle"
    assert fighting_env.last_agent_health == INITIAL_HEALTH
    assert fighting_env.last_opponent_health == INITIAL_HEALTH
    assert fighting_env.last_distance == abs(fighting_env.player_agent.rect.centerx - fighting_env.opponent_player.rect.centerx)

def test_env_step_idle_action(fighting_env):
    obs = fighting_env.reset()
    initial_agent_health = fighting_env.player_agent.health
    initial_opponent_health = fighting_env.opponent_player.health

    # Take an idle action (action 0)
    next_obs, reward, done, info = fighting_env.step(0)

    assert isinstance(next_obs, np.ndarray)
    assert reward == 0 # Should get 0 reward for idle as per current logic
    assert not done
    assert fighting_env.player_agent.health == initial_agent_health # No damage taken from idle
    assert fighting_env.opponent_player.health == initial_opponent_health # No damage dealt from idle

    def test_env_step_attack_action(fighting_env):
        obs = fighting_env.reset()

        # 강제로 두 캐릭터를 아주 가까이 붙임
        fighting_env.player_agent.rect.x = 200
        fighting_env.player_agent._pos_x = float(fighting_env.player_agent.rect.x)

        fighting_env.opponent_player.rect.x = 220  # 거의 붙여놓음
        fighting_env.opponent_player._pos_x = float(fighting_env.opponent_player.rect.x)

        initial_opponent_health = fighting_env.opponent_player.health
        # Ensure players are facing each other
        fighting_env.player_agent.facing = 1 # Face right
        fighting_env.opponent_player.facing = -1 # Face left
    # Take an attack action (action 4)
    next_obs, reward, done, info = fighting_env.step(4)

    # Run for a few more steps to ensure collision and damage registration
    for _ in range(5):
        if done: break
        next_obs, step_reward, done, info = fighting_env.step(0) # Idle action
        reward += step_reward

    assert isinstance(next_obs, np.ndarray)
    # Expect opponent to take damage, so reward should be positive
    assert reward > 0
    assert not done
    assert fighting_env.opponent_player.health < initial_opponent_health

    def test_env_step_ko_victory(fighting_env):
        obs = fighting_env.reset()
        # Set opponent health to 1 for easy KO
        fighting_env.opponent_player.health = 1
        fighting_env.last_opponent_health = 1

        # Move players close for attack to hit
        fighting_env.player_agent.rect.x = SCREEN_WIDTH // 2 - PLAYER_WIDTH // 2
        fighting_env.player_agent._pos_x = float(fighting_env.player_agent.rect.x)
        fighting_env.player_agent.rect.y = SCREEN_HEIGHT - PLAYER_HEIGHT
        fighting_env.player_agent._pos_y = float(fighting_env.player_agent.rect.y)

        fighting_env.opponent_player.rect.x = fighting_env.player_agent.rect.x + PLAYER_WIDTH - 10 # Overlap by 10 pixels
        fighting_env.opponent_player._pos_x = float(fighting_env.opponent_player.rect.x)
        fighting_env.opponent_player.rect.y = SCREEN_HEIGHT - PLAYER_HEIGHT
        fighting_env.opponent_player._pos_y = float(fighting_env.opponent_player.rect.y)

        fighting_env.player_agent.facing = 1 # Face right
        fighting_env.opponent_player.facing = -1 # Face left
    # Take an attack action (action 4)
    next_obs, reward, done, info = fighting_env.step(4)

    # Run for a few more steps to ensure collision and KO registration
    for _ in range(5):
        if done: break
        next_obs, step_reward, done, info = fighting_env.step(0) # Idle action
        reward += step_reward

    assert isinstance(next_obs, np.ndarray)
    assert reward > 0 # Should get KO reward
    assert done
    assert fighting_env.opponent_player.health == 0

    def test_env_step_ko_defeat(fighting_env):
        obs = fighting_env.reset()
        # Set agent health to 1 for easy KO
        fighting_env.player_agent.health = 1
        fighting_env.last_agent_health = 1

        # Simulate opponent attacking agent
        fighting_env.opponent_player.rect.x = SCREEN_WIDTH // 2 + PLAYER_WIDTH // 2 + 20
        fighting_env.opponent_player._pos_x = float(fighting_env.opponent_player.rect.x)
        fighting_env.opponent_player.rect.y = SCREEN_HEIGHT - PLAYER_HEIGHT
        fighting_env.opponent_player._pos_y = float(fighting_env.opponent_player.rect.y)

        fighting_env.player_agent.rect.x = SCREEN_WIDTH // 2 - PLAYER_WIDTH // 2 - 20
        fighting_env.player_agent._pos_x = float(fighting_env.player_agent.rect.x)
        fighting_env.player_agent.rect.y = SCREEN_HEIGHT - PLAYER_HEIGHT
        fighting_env.player_agent._pos_y = float(fighting_env.player_agent.rect.y)

        fighting_env.opponent_player.facing = -1
        fighting_env.player_agent.facing = 1

        # Manually set opponent to attacking state after reset
        fighting_env.opponent_player.is_attacking = True
        fighting_env.opponent_player.attack_hitbox.active = True
        fighting_env.opponent_player.attack_hitbox.damage = 10 # Ensure damage is enough for KO
        fighting_env.opponent_player.attack_timer = ATTACK_DURATION # Ensure attack state persists
    # Take an idle action (action 0) while opponent attacks
    next_obs, reward, done, info = fighting_env.step(0)

    # Run for a few more steps to ensure collision and KO registration
    for _ in range(5):
        if done: break
        next_obs, step_reward, done, info = fighting_env.step(0) # Idle action
        reward += step_reward

    assert isinstance(next_obs, np.ndarray)
    assert reward < 0 # Should get KO penalty
    assert done
    assert fighting_env.player_agent.health == 0
