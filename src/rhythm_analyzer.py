import collections

import numpy as np
from scipy.stats import entropy


class RhythmAnalyzer:
    """
    플레이어의 행동 로그를 기반으로 '전투 리듬' 관련 지표를 실시간으로 계산한다.
    """

    def __init__(self, window_size: int, fps: int):
        """
        RhythmAnalyzer 인스턴스를 초기화한다.
        :param window_size: 분석할 최대 행동 로그 크기 (행동의 개수).
        :param fps: 게임의 초당 프레임 수.
        """
        if not isinstance(window_size, int) or window_size <= 0:
            raise ValueError("window_size must be a positive integer.")
        if not isinstance(fps, int) or fps <= 0:
            raise ValueError("fps must be a positive integer.")

        self.action_log = collections.deque(maxlen=window_size)
        self.fps = fps

        # 기술 명세서 및 구현 알고리즘 명세서 기반 액션 정의
        # Standardized to actions used in applyExternalAction pseudo-code
        self.offensive_actions = {"light_punch", "heavy_kick"}
        self.defensive_actions = {"guard"}

    def add_action(self, action: str, frame: int):
        """
        새로운 행동 로그를 추가한다.
        :param action: 'PUNCH', 'GUARD' 등 행동을 나타내는 문자열.
        :param frame: 해당 행동이 발생한 게임 프레임 번호.
        """
        self.action_log.append({"action": action, "frame": frame})

    def get_metrics(self) -> dict[str, float]:
        """
        현재까지 수집된 action_log를 바탕으로 모든 리듬 지표를 계산하여 딕셔너리 형태로 반환한다.
        """
        if not self.action_log:
            return {
                "apm": 0.0,
                "action_density": 0.0,
                "offense_defense_ratio": 0.0,
                "rhythm_entropy": 0.0,
            }

        total_actions = len(self.action_log)
        first_frame = self.action_log[0]["frame"]
        last_frame = self.action_log[-1]["frame"]
        duration_frames = last_frame - first_frame
        duration_seconds = (
            duration_frames / self.fps
            if duration_frames > 0
            else total_actions / self.fps
        )

        # 1. APM (Actions Per Minute)
        apm = (total_actions / duration_seconds) * 60 if duration_seconds > 0 else 0.0

        # 2. 행동 밀도 (Action Density)
        action_density = (
            total_actions / duration_seconds if duration_seconds > 0 else 0.0
        )

        # 3. 공격/방어 비율 (Offense/Defense Ratio)
        offense_count = sum(
            1 for log in self.action_log if log["action"] in self.offensive_actions
        )
        defense_count = sum(
            1 for log in self.action_log if log["action"] in self.defensive_actions
        )

        if defense_count > 0:
            offense_defense_ratio = offense_count / defense_count
        elif offense_count > 0:
            offense_defense_ratio = offense_count
        else:
            offense_defense_ratio = 0.0

        # 4. 리듬 엔트로피 (Rhythm Entropy)
        action_sequence = [log["action"] for log in self.action_log]
        _, counts = np.unique(action_sequence, return_counts=True)
        rhythm_entropy = entropy(counts, base=2)

        return {
            "apm": apm,
            "action_density": action_density,
            "offense_defense_ratio": offense_defense_ratio,
            "rhythm_entropy": rhythm_entropy,
        }

    def get_feature_vector(self) -> np.ndarray:
        """
        AI 강화학습 모델의 입력으로 사용될 고정된 순서의 특징 벡터(1D Numpy 배열)를 반환한다.
        """
        metrics = self.get_metrics()
        return np.array(
            [
                metrics["apm"],
                metrics["action_density"],
                metrics["offense_defense_ratio"],
                metrics["rhythm_entropy"],
            ]
        )
