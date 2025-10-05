'''
이 모듈은 플레이어의 행동 시퀀스를 분석하여 '전투 리듬'과 관련된
다양한 정량적 지표를 추출하는 RhythmAnalyzer 클래스를 포함합니다.
'''
import collections
import numpy as np
from scipy.stats import entropy

class RhythmAnalyzer:
    """
    플레이어의 행동 로그를 기반으로 '전투 리듬' 관련 지표를 계산합니다.
    이 클래스는 APM, 행동 밀도, 공격/방어 비율, 리듬 엔트로피 등의
    지표를 제공하여 플레이 스타일을 정량적으로 분석합니다.
    """
    def __init__(self, window_size=300, fps=60):
        """
        RhythmAnalyzer를 초기화합니다.

        :param window_size: 분석할 행동 시퀀스의 최대 길이 (프레임 수)
        :param fps: 게임의 초당 프레임 수
        """
        self.action_log = collections.deque(maxlen=window_size)
        self.fps = fps
        
        # TODO: 게임의 실제 액션 목록에 맞게 확장해야 합니다.
        self.offensive_actions = {'PUNCH', 'KICK', 'SPECIAL_1'}
        self.defensive_actions = {'GUARD', 'DODGE'}
        self.movement_actions = {'MOVE_LEFT', 'MOVE_RIGHT', 'JUMP'}

    def add_action(self, action: str, frame: int):
        """
        새로운 행동을 로그에 추가합니다.

        :param action: 플레이어의 행동 (예: 'PUNCH')
        :param frame: 행동이 발생한 현재 프레임
        """
        self.action_log.append({'action': action, 'frame': frame})

    def get_metrics(self) -> dict:
        """
        현재까지 기록된 행동 로그를 바탕으로 모든 리듬 지표를 계산합니다.

        :return: 계산된 지표들이 담긴 딕셔너리
        """
        if not self.action_log or len(self.action_log) < 2:
            return self._get_default_metrics()

        # 1. APM (Actions Per Minute)
        duration_frames = self.action_log[-1]['frame'] - self.action_log[0]['frame']
        duration_seconds = duration_frames / self.fps if self.fps > 0 else 0
        apm = (len(self.action_log) / duration_seconds) * 60 if duration_seconds > 0 else 0

        # 2. 행동 밀도 (Action Density)
        # window_size 시간 동안의 행동 수이므로, 현재 로그의 길이와 같습니다.
        action_density = len(self.action_log)

        # 3. 공격/방어 비율 (Offense/Defense Ratio)
        offense_count = sum(1 for log in self.action_log if log['action'] in self.offensive_actions)
        defense_count = sum(1 for log in self.action_log if log['action'] in self.defensive_actions)
        offense_defense_ratio = offense_count / defense_count if defense_count > 0 else float(offense_count)

        # 4. 리듬 엔트로피 (Rhythm Entropy)
        # 행동 시퀀스의 예측 불가능성을 측정합니다.
        action_counts = collections.Counter(log['action'] for log in self.action_log)
        probabilities = np.array(list(action_counts.values())) / len(self.action_log)
        rhythm_entropy = entropy(probabilities, base=2)

        # TODO: 선제공격률, 행동 반복 주기 등 추가 지표 구현 필요

        return {
            "apm": apm,
            "action_density": action_density,
            "offense_defense_ratio": offense_defense_ratio,
            "rhythm_entropy": rhythm_entropy,
        }

    def get_feature_vector(self) -> np.ndarray:
        """
        AI 모델의 입력으로 사용될 수 있는 특징 벡터를 반환합니다.
        벡터의 순서는 항상 일정하게 유지되어야 합니다.

        :return: 지표 값들로 구성된 numpy 배열
        """
        metrics = self.get_metrics()
        return np.array([
            metrics["apm"],
            metrics["action_density"],
            metrics["offense_defense_ratio"],
            metrics["rhythm_entropy"],
        ])

    def _get_default_metrics(self) -> dict:
        """행동 로그가 비어있을 때 반환할 기본 지표 값입니다."""
        return {
            "apm": 0.0,
            "action_density": 0,
            "offense_defense_ratio": 1.0, # 중립적인 비율
            "rhythm_entropy": 0.0,
        }
