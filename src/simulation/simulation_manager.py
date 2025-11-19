import numpy as np
import random
import time
import os
from typing import Dict, Any

class SimulationManager:
    """
    강화학습 시뮬레이션의 안정성과 재현성을 관리하는 클래스입니다.
    FPS 고정, 랜덤 시드 관리, 학습 로그 수집 등의 기능을 제공합니다.
    """

    def __init__(self, target_fps: int = 60, seed: int = None):
        self.target_fps = target_fps
        self.fixed_timestep = 1.0 / target_fps
        self.last_frame_time = time.time()
        self.seed_value = seed
        self.set_seed(seed)

        self.log_dir = None
        self.episode_logs = []

    def set_seed(self, seed: int = None):
        if seed is None:
            # If no seed is provided, generate a random one
            self.seed_value = random.randint(0, 2**32 - 1)
        else:
            self.seed_value = seed
        
        np.random.seed(self.seed_value)
        random.seed(self.seed_value)

    def get_fixed_timestep(self) -> float:
        """
        고정된 타임스텝 값을 반환합니다.
        """
        return self.fixed_timestep

    def wait_for_next_frame(self):
        """
        설정된 FPS에 맞춰 다음 프레임까지 대기합니다.
        """
        current_time = time.time()
        elapsed_time = current_time - self.last_frame_time
        time_to_wait = self.fixed_timestep - elapsed_time

        if time_to_wait > 0:
            time.sleep(time_to_wait)
        self.last_frame_time = time.time()

    def start_logging(self, log_dir: str):
        """
        학습 로그를 지정된 디렉토리에 기록하기 시작합니다.
        """
        os.makedirs(log_dir, exist_ok=True)
        self.log_dir = log_dir
        self.episode_logs = []
        print(f"SimulationManager: Logging started in {log_dir}")

    def log_episode_data(self, episode_data: Dict[str, Any]):
        """
        한 에피소드의 데이터를 로그에 추가합니다.
        """
        if self.log_dir is None:
            print("Warning: Logging directory not set. Episode data not logged.")
            return
        self.episode_logs.append(episode_data)
        # In a real scenario, you might write this to a file incrementally
        # or use a more sophisticated logging library.

    def save_logs(self, filename: str = "episode_logs.json"):
        """
        수집된 에피소드 로그를 파일로 저장합니다.
        """
        if self.log_dir and self.episode_logs:
            import json
            filepath = os.path.join(self.log_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(self.episode_logs, f, ensure_ascii=False, indent=4)
            print(f"SimulationManager: Episode logs saved to {filepath}")
        elif not self.log_dir:
            print("Warning: No log directory specified, cannot save logs.")
        else:
            print("Info: No episode logs to save.")
