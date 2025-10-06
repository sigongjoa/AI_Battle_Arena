import asyncio
from unittest.mock import ANY, MagicMock, patch

import numpy as np
import pytest

# This import will work when running pytest with `PYTHONPATH=.`
from backend.core.game_runner import GameRunner


# Helper for async generator
async def anext(ait):
    return await ait.__anext__()


@pytest.mark.asyncio
@patch("stable_baselines3.PPO.load")
@patch("backend.core.game_runner.FightingEnv")
async def test_game_runner_integration_with_rhythm_analyzer(
    mock_env_class, mock_ppo_load
):
    """
    Tests that GameRunner correctly integrates RhythmAnalyzer to enrich the
    observation passed to the AI model and updates the analyzers.
    """
    # 1. Setup Mocks
    # Mock the model and its predict method
    mock_predict = MagicMock(
        return_value=(np.array([4, 5]), None)
    )  # action 4:PUNCH, 5:KICK
    mock_model = MagicMock()
    mock_model.predict = mock_predict
    mock_ppo_load.return_value = mock_model

    # Mock the FightingEnv instance
    mock_env_instance = MagicMock()
    initial_obs = np.ones(8, dtype=np.float32) * 0.5
    mock_env_instance.reset.return_value = (initial_obs, {})
    # The next observation after a step
    next_obs = np.ones(8, dtype=np.float32) * 0.6
    mock_env_instance.step.return_value = (next_obs, 1.0, False, False, {})
    # Mock the game object inside the env for frame_count
    mock_env_instance.game.frame_count = 10

    # Mock player objects within mock_env_instance.game
    mock_player1 = MagicMock()
    mock_player1.rect.centerx = 100
    mock_player1.rect.centery = 200
    mock_player1.state = "IDLE"
    mock_player1.health = 100

    mock_player2 = MagicMock()
    mock_player2.rect.centerx = 700
    mock_player2.rect.centery = 200
    mock_player2.state = "IDLE"
    mock_player2.health = 100

    mock_env_instance.game.player1 = mock_player1
    mock_env_instance.game.player2 = mock_player2
    mock_env_class.return_value = mock_env_instance

    # 2. Initialize GameRunner
    runner = GameRunner(match_id="test_match", player1_id="1", player2_id="2")
    # The runner's observation should be the initial observation from env.reset()
    assert np.array_equal(runner.obs, initial_obs)
    assert runner.player1_analyzer is not None
    assert runner.player2_analyzer is not None

    # 3. Run one iteration of the game loop
    game_state_generator = runner.run_grpc_stream()
    await anext(game_state_generator)

    # 4. Assertions
    # a) Check that model.predict was called once
    mock_predict.assert_called_once()

    # b) Check the enriched observation passed to predict
    call_args, call_kwargs = mock_predict.call_args
    enriched_obs = call_args[0]

    assert enriched_obs.shape == (
        16,
    ), "Observation shape should be 16 (8 base + 8 rhythm)"

    # The first 8 elements should be the initial observation
    assert np.array_equal(enriched_obs[:8], initial_obs)

    # The last 8 elements should be the rhythm metrics (initially zeros)
    assert np.all(
        enriched_obs[8:] == 0
    ), "Rhythm metrics should be all zeros on the first frame"

    # c) Check that the analyzers were updated after the step
    assert (
        len(runner.player1_analyzer.action_log) == 1
    ), "P1 analyzer should have one action log"
    assert (
        len(runner.player2_analyzer.action_log) == 1
    ), "P2 analyzer should have one action log"

    p1_log = runner.player1_analyzer.action_log[0]
    assert p1_log["action"] == "PUNCH"
    assert p1_log["frame"] == 10  # Should match the mocked frame_count

    p2_log = runner.player2_analyzer.action_log[0]
    assert p2_log["action"] == "KICK"
    assert p2_log["frame"] == 10

    # d) Check that the base observation for the next loop is updated
    assert np.array_equal(
        runner.obs, next_obs
    ), "Base observation should be updated for the next frame"
