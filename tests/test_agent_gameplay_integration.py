import pytest
import gymnasium as gym
from src.fighting_env import FightingEnv
import numpy as np
from enum import Enum
import sys # Import sys

class Action(Enum):
    NO_OP = 0
    MOVE_FWD = 1
    MOVE_BWD = 2
    JUMP = 3
    ATTACK_1 = 4
    ATTACK_2 = 5

# Dummy Agent for testing purposes
class DummyAgent:
    def __init__(self, player_id, actions=None):
        self.player_id = player_id
        self.actions = actions if actions is not None else []
        self.action_idx = 0

    def predict(self, observation):
        if self.action_idx < len(self.actions):
            action = self.actions[self.action_idx]
            self.action_idx += 1
            return action
        return Action.NO_OP.value # Default to NO_OP if no more actions

    def reset(self):
        self.action_idx = 0

@pytest.fixture
def fighting_env():
    # Use a fixed backend_peer_id for testing
    env = FightingEnv(backend_peer_id="test_peer_id", render_mode=None, test_mode=True)
    yield env
    env.close()

def get_player_state(info, player_idx):
    return info[f'player_{player_idx}_state']

def test_env_initialization_and_reset(fighting_env):
    obs, info = fighting_env.reset()
    assert obs is not None
    assert 'player_1_state' in info
    assert 'player_2_state' in info
    assert info['player_1_state']['health'] == 1.0
    assert info['player_2_state']['health'] == 1.0
    assert not info['round_over']

def test_agent_movement(fighting_env):
    # P1 moves right (MOVE_FWD), P2 stands still
    p1_agent = DummyAgent(player_id=1, actions=[Action.MOVE_FWD.value, Action.NO_OP.value])
    p2_agent = DummyAgent(player_id=2, actions=[Action.NO_OP.value, Action.NO_OP.value])

    obs, info = fighting_env.reset()
    initial_p1_pos_x = info['player_1_state']['position'][0]

    # Step 1: P1 moves right
    action_p1 = p1_agent.predict(obs)
    action_p2 = p2_agent.predict(obs)
    actions = (action_p1, action_p2)
    obs, reward, terminated, truncated, info = fighting_env.step(actions)

    # Check if P1's position has changed (moved right)
    assert info['player_1_state']['position'][0] > initial_p1_pos_x
    assert not terminated

    # Step 2: P1 stands still, P2 stands still
    action_p1 = p1_agent.predict(obs)
    action_p2 = p2_agent.predict(obs)
    actions = (action_p1, action_p2)
    obs, reward, terminated, truncated, info = fighting_env.step(actions)

    # Position should not change significantly if standing still (due to friction/game physics)
    # For simplicity, we just check it's still to the right of initial
    assert info['player_1_state']['position'][0] > initial_p1_pos_x
    assert not terminated

def test_agent_attack_and_health_reduction(fighting_env):
    # P1 attacks, P2 stands still and gets hit
    # This test assumes P1 starts close enough to P2 to hit with a basic attack
    p1_agent = DummyAgent(player_id=1, actions=[Action.ATTACK_1.value, Action.NO_OP.value])
    p2_agent = DummyAgent(player_id=2, actions=[Action.NO_OP.value, Action.NO_OP.value])

    obs, info = fighting_env.reset()
    initial_p2_health = info['player_2_state']['health']

    # Step 1: P1 attacks
    action_p1 = p1_agent.predict(obs)
    action_p2 = p2_agent.predict(obs)
    actions = (action_p1, action_p2)
    obs, reward, terminated, truncated, info = fighting_env.step(actions)

    # Check if P2's health has decreased
    assert info['player_2_state']['health'] < initial_p2_health
    assert reward > 0 # Assuming P1 gets reward for dealing damage
    assert not terminated

def test_win_loss_condition(fighting_env):
    # Simulate P1 winning by reducing P2's health to zero
    # This requires a way to directly manipulate health or simulate many attacks
    # For this test, we'll simulate a scenario where P1 deals fatal damage
    p1_agent = DummyAgent(player_id=1, actions=[Action.ATTACK_1.value] * 10) # Many attacks
    p2_agent = DummyAgent(player_id=2, actions=[Action.NO_OP.value] * 10)

    obs, info = fighting_env.reset()
    terminated = False
    total_reward = 0
    step_count = 0
    max_steps = 500 # Safeguard to prevent infinite loops

    # Keep stepping until round is over
    while not terminated and step_count < max_steps:
        action_p1 = p1_agent.predict(obs)
        action_p2 = p2_agent.predict(obs)
        actions = (action_p1, action_p2)
        obs, reward, terminated, truncated, info = fighting_env.step(actions)
        total_reward += reward
        step_count += 1
        if 'round_over' in info and info['round_over']:
            break

    assert terminated
    assert info['round_over']
    assert info['player_1_state']['health'] > 0 # P1 should have health left
    assert info['player_2_state']['health'] <= 0 # P2 should have 0 or less health
    assert info['player_1_won'] == True # P1 should be the winner
    assert total_reward > 0 # P1 should have accumulated positive reward for winning

def test_reward_for_dealing_damage(fighting_env):
    p1_agent = DummyAgent(player_id=1, actions=[Action.ATTACK_1.value])
    p2_agent = DummyAgent(player_id=2, actions=[Action.NO_OP.value])

    obs, info = fighting_env.reset()
    initial_p2_health = info['player_2_state']['health']

    # P1 attacks
    action_p1 = p1_agent.predict(obs)
    action_p2 = p2_agent.predict(obs)
    actions = (action_p1, action_p2)
    obs, reward, terminated, truncated, info = fighting_env.step(actions)

    # Check if P2's health has decreased
    assert info['player_2_state']['health'] < initial_p2_health
    assert reward > 0 # P1 should get a positive reward for dealing damage
    assert not terminated

def test_reward_for_taking_damage(fighting_env):
    # Simulate P2 attacking P1
    # This requires P2 to attack and P1 to be hit
    # For simplicity, we'll assume the environment's internal game state handles this
    # and we check the reward from P1's perspective (which should be negative)
    p1_agent = DummyAgent(player_id=1, actions=[Action.NO_OP.value])
    p2_agent = DummyAgent(player_id=2, actions=[Action.ATTACK_1.value])

    obs, info = fighting_env.reset()
    initial_p1_health = info['player_1_state']['health']

    # P2 attacks
    action_p1 = p1_agent.predict(obs)
    action_p2 = p2_agent.predict(obs)
    actions = (action_p1, action_p2)
    obs, reward, terminated, truncated, info = fighting_env.step(actions)

    # Check if P1's health has decreased
    assert info['player_1_state']['health'] < initial_p1_health
    assert reward < 0 # P1 should get a negative reward for taking damage
    assert not terminated
