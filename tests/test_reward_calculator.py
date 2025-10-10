import pytest
from src.reward_calculator import RewardCalculator

@pytest.fixture
def default_reward_calculator():
    return RewardCalculator()

@pytest.fixture
def custom_reward_calculator():
    return RewardCalculator(
        damage_reward_scale=0.5,
        damage_penalty_scale=0.3,
        win_reward=500.0,
        loss_penalty=-300.0,
        distance_closer_reward_scale=0.01,
        distance_further_penalty_scale=0.005,
        idle_penalty=-0.1
    )

def test_initialization_default_values(default_reward_calculator):
    assert default_reward_calculator.damage_reward_scale == 0.1
    assert default_reward_calculator.damage_penalty_scale == 0.1
    assert default_reward_calculator.win_reward == 100.0
    assert default_reward_calculator.loss_penalty == -100.0
    assert default_reward_calculator.distance_closer_reward_scale == 0.001
    assert default_reward_calculator.distance_further_penalty_scale == 0.0005
    assert default_reward_calculator.idle_penalty == 0.0

def test_initialization_custom_values(custom_reward_calculator):
    assert custom_reward_calculator.damage_reward_scale == 0.5
    assert custom_reward_calculator.damage_penalty_scale == 0.3
    assert custom_reward_calculator.win_reward == 500.0
    assert custom_reward_calculator.loss_penalty == -300.0
    assert custom_reward_calculator.distance_closer_reward_scale == 0.01
    assert custom_reward_calculator.distance_further_penalty_scale == 0.005
    assert custom_reward_calculator.idle_penalty == -0.1

def test_calculate_reward_damage_dealt(default_reward_calculator):
    player_state = {"health": 100, "x": 0}
    opponent_state = {"health": 90, "x": 10}
    game_info = {"round_over": False}
    last_player_health = 100
    last_opponent_health = 100
    last_distance = 10

    reward = default_reward_calculator.calculate_reward(
        player_state, opponent_state, game_info, 1,
        last_player_health, last_opponent_health, last_distance
    )
    # Damage dealt: 100 - 90 = 10. Reward: 10 * 0.1 = 1.0
    assert reward == 1.0

def test_calculate_reward_damage_taken(default_reward_calculator):
    player_state = {"health": 90, "x": 0}
    opponent_state = {"health": 100, "x": 10}
    game_info = {"round_over": False}
    last_player_health = 100
    last_opponent_health = 100
    last_distance = 10

    reward = default_reward_calculator.calculate_reward(
        player_state, opponent_state, game_info, 1,
        last_player_health, last_opponent_health, last_distance
    )
    # Damage taken: 100 - 90 = 10. Penalty: -10 * 0.1 = -1.0
    assert reward == -1.0

def test_calculate_reward_win(default_reward_calculator):
    player_state = {"health": 100, "x": 0}
    opponent_state = {"health": 0, "x": 10}
    game_info = {"round_over": True, "player_won": True}
    last_player_health = 100
    last_opponent_health = 10
    last_distance = 10

    reward = default_reward_calculator.calculate_reward(
        player_state, opponent_state, game_info, 1,
        last_player_health, last_opponent_health, last_distance
    )
    # Damage dealt: 10. Reward: 1.0. Win reward: 100.0. Total: 101.0
    assert reward == 1.0 + 100.0

def test_calculate_reward_loss(default_reward_calculator):
    player_state = {"health": 0, "x": 0}
    opponent_state = {"health": 100, "x": 10}
    game_info = {"round_over": True, "player_won": False}
    last_player_health = 10
    last_opponent_health = 100
    last_distance = 10

    reward = default_reward_calculator.calculate_reward(
        player_state, opponent_state, game_info, 1,
        last_player_health, last_opponent_health, last_distance
    )
    # Damage taken: 10. Penalty: -1.0. Loss penalty: -100.0. Total: -101.0
    assert reward == -1.0 - 100.0

def test_calculate_reward_distance_closer(default_reward_calculator):
    player_state = {"health": 100, "x": 0}
    opponent_state = {"health": 100, "x": 5}
    game_info = {"round_over": False}
    last_player_health = 100
    last_opponent_health = 100
    last_distance = 10

    reward = default_reward_calculator.calculate_reward(
        player_state, opponent_state, game_info, 1,
        last_player_health, last_opponent_health, last_distance
    )
    # Distance change: 10 - 5 = 5. Reward: 5 * 0.001 = 0.005
    assert reward == pytest.approx(0.005)

def test_calculate_reward_distance_further(default_reward_calculator):
    player_state = {"health": 100, "x": 0}
    opponent_state = {"health": 100, "x": 15}
    game_info = {"round_over": False}
    last_player_health = 100
    last_opponent_health = 100
    last_distance = 10

    reward = default_reward_calculator.calculate_reward(
        player_state, opponent_state, game_info, 1,
        last_player_health, last_opponent_health, last_distance
    )
    # Distance change: 10 - 15 = -5. Penalty: -abs(-5) * 0.0005 = -0.0025
    assert reward == pytest.approx(-0.0025)

def test_calculate_reward_idle_penalty(custom_reward_calculator):
    player_state = {"health": 100, "x": 0}
    opponent_state = {"health": 100, "x": 10}
    game_info = {"round_over": False}
    last_player_health = 100
    last_opponent_health = 100
    last_distance = 10

    reward = custom_reward_calculator.calculate_reward(
        player_state, opponent_state, game_info, 0, # Action 0 is idle
        last_player_health, last_opponent_health, last_distance
    )
    # Idle penalty: -0.1
    assert reward == pytest.approx(-0.1)

def test_calculate_reward_combined(custom_reward_calculator):
    player_state = {"health": 95, "x": 2}
    opponent_state = {"health": 80, "x": 8}
    game_info = {"round_over": False}
    last_player_health = 100
    last_opponent_health = 90
    last_distance = 10

    # Damage dealt: 90 - 80 = 10. Reward: 10 * 0.5 = 5.0
    # Damage taken: 100 - 95 = 5. Penalty: -5 * 0.3 = -1.5
    # Distance change: 10 - 6 = 4. Reward: 4 * 0.01 = 0.04
    # Idle penalty: N/A (action is not 0)
    # Total: 5.0 - 1.5 + 0.04 = 3.54

    reward = custom_reward_calculator.calculate_reward(
        player_state, opponent_state, game_info, 1,
        last_player_health, last_opponent_health, last_distance
    )
    assert reward == pytest.approx(3.54)

def test_distance_reward_helper(default_reward_calculator):
    # Moving closer
    assert default_reward_calculator._distance_reward(0, 5, 10) == pytest.approx(5 * 0.001)
    # Moving further
    assert default_reward_calculator._distance_reward(0, 15, 10) == pytest.approx(-5 * 0.0005)
    # No change
    assert default_reward_calculator._distance_reward(0, 10, 10) == 0.0
