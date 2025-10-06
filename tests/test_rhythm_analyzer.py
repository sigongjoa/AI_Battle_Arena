import numpy as np
import pytest

from src.rhythm_analyzer import RhythmAnalyzer


@pytest.fixture
def analyzer():
    """Provides a default RhythmAnalyzer instance for tests."""
    return RhythmAnalyzer(window_size=100, fps=60)


class TestRhythmAnalyzer:

    def test_initialization(self):
        analyzer = RhythmAnalyzer(window_size=50, fps=30)
        assert analyzer.action_log.maxlen == 50
        assert analyzer.fps == 30
        with pytest.raises(ValueError):
            RhythmAnalyzer(window_size=0, fps=60)
        with pytest.raises(ValueError):
            RhythmAnalyzer(window_size=100, fps=-1)

    def test_add_action(self, analyzer):
        analyzer.add_action("PUNCH", 10)
        analyzer.add_action("GUARD", 20)
        assert len(analyzer.action_log) == 2
        assert analyzer.action_log[0] == {"action": "PUNCH", "frame": 10}
        assert analyzer.action_log[1] == {"action": "GUARD", "frame": 20}

    def test_add_action_window_size(self):
        analyzer = RhythmAnalyzer(window_size=3, fps=60)
        analyzer.add_action("A", 1)
        analyzer.add_action("B", 2)
        analyzer.add_action("C", 3)
        assert len(analyzer.action_log) == 3
        analyzer.add_action("D", 4)
        assert len(analyzer.action_log) == 3
        assert analyzer.action_log[0]["action"] == "B"

    def test_get_metrics_empty_log(self, analyzer):
        metrics = analyzer.get_metrics()
        expected = {
            "apm": 0.0,
            "action_density": 0.0,
            "offense_defense_ratio": 0.0,
            "rhythm_entropy": 0.0,
        }
        assert metrics == expected

    def test_get_metrics_single_action(self, analyzer):
        analyzer.add_action("light_punch", 1)
        metrics = analyzer.get_metrics()
        assert metrics["apm"] > 0
        assert metrics["action_density"] > 0
        assert metrics["offense_defense_ratio"] == 1.0
        assert np.isclose(metrics["rhythm_entropy"], 0.0)

    def test_get_metrics_calculation(self, analyzer):
        analyzer.add_action("light_punch", 0)
        analyzer.add_action("guard", 15)
        analyzer.add_action("light_punch", 30)
        analyzer.add_action("heavy_kick", 45)
        analyzer.add_action("guard", 60)

        metrics = analyzer.get_metrics()

        assert np.isclose(metrics["apm"], 300.0)
        assert np.isclose(metrics["action_density"], 5.0)
        assert np.isclose(metrics["offense_defense_ratio"], 1.5)
        assert np.isclose(metrics["rhythm_entropy"], 1.5219, atol=1e-4)

    def test_get_metrics_zero_entropy(self, analyzer):
        analyzer.add_action("PUNCH", 0)
        analyzer.add_action("PUNCH", 10)
        analyzer.add_action("PUNCH", 20)
        metrics = analyzer.get_metrics()
        assert np.isclose(metrics["rhythm_entropy"], 0.0)

    def test_get_feature_vector(self, analyzer):
        analyzer.add_action("PUNCH", 0)
        analyzer.add_action("GUARD", 30)

        metrics = analyzer.get_metrics()
        feature_vector = analyzer.get_feature_vector()

        assert isinstance(feature_vector, np.ndarray)
        assert feature_vector.shape == (4,)
        expected_vector = np.array(
            [
                metrics["apm"],
                metrics["action_density"],
                metrics["offense_defense_ratio"],
                metrics["rhythm_entropy"],
            ]
        )
        assert np.allclose(feature_vector, expected_vector)
