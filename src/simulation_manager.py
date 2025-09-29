import pygame
import numpy as np
import random
import os
import json
from datetime import datetime
from typing import Dict, Any

class SimulationManager:
    """
    강화학습 시뮬레이션의 안정성과 재현성을 관리하는 클래스입니다.
    FPS 고정, 랜덤 시드 관리, 학습 로그 수집 등의 기능을 제공합니다.
    """

    def __init__(self, fps: int = 60, seed: int = None, log_dir: str = "./logs"):
        self.fps = fps
        self.seed = seed
        self.log_dir = log_dir
        self.log_data = []
        self.episode_count = 0

        if self.seed is not None:
            self.set_seed(self.seed)
        
        os.makedirs(self.log_dir, exist_ok=True)

    def set_seed(self, seed: int):
        """
        시뮬레이션 전반에 걸쳐 랜덤 시드를 설정합니다.
        """
        self.seed = seed
        np.random.seed(self.seed)
        random.seed(self.seed)
        # Pygame's random functions are not directly seeded by Python's random module
        # If Pygame has its own random states, they would need to be set here.
        # For now, assuming numpy and random are sufficient for RL context.

    def get_fixed_timestep(self) -> float:
        """
        고정된 타임스텝 값을 반환합니다.
        """
        return 1.0 / self.fps

    def start_logging(self, experiment_name: str = "experiment"):
        """
        학습 로그를 지정된 디렉토리에 기록하기 시작합니다.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.current_log_file = os.path.join(self.log_dir, f"{experiment_name}_{timestamp}.jsonl")
        print(f"Starting logging to: {self.current_log_file}")
        self.log_data = [] # Clear previous log data
        self.episode_count = 0

    def log_episode_data(self, episode_data: Dict[str, Any]):
        """
        한 에피소드의 데이터를 로그에 추가합니다.
        """
        if hasattr(self, 'current_log_file'):
            self.episode_count += 1
            episode_data["episode"] = self.episode_count
            with open(self.current_log_file, 'a') as f:
                f.write(json.dumps(episode_data) + '\n')
        else:
            print("Warning: Logging not started. Call start_logging() first.")

    def get_clock(self) -> pygame.time.Clock:
        """
        Pygame clock 객체를 반환합니다.
        """
        return pygame.time.Clock()
