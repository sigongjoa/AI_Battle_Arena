import gym
from gym import spaces
import numpy as np
import pygame
from typing import Dict, Any, Tuple

from src.game import Game
from src.player import Player
from src.constants import (
    SCREEN_WIDTH, SCREEN_HEIGHT, INITIAL_HEALTH, FPS,
    PLAYER_WIDTH, PLAYER_HEIGHT
)
from src.interfaces import get_game_state, apply_ai_action
from src.reward_calculator import RewardCalculator
from src.simulation_manager import SimulationManager

class FightingEnv(gym.Env):
    """
    Pygame 기반 격투 게임을 위한 강화학습 환경 (Gym 스타일).
    이제 두 플레이어 모두 에이전트에 의해 제어됩니다.
    """

    def __init__(self, seed: int = None, headless: bool = False):
        super(FightingEnv, self).__init__()

        # State: 내 체력, 상대 체력, 거리, 내 x, 내 y, 내 상태, 상대 상태
        # 내 상태: idle, walk, jump, attack, guard, hit (0-5)
        # 상대 상태: idle, walk, jump, attack, guard, hit (0-5)
        # Total 5 + 2 = 7 features
        # Observation space remains the same, but now represents the full game state for both agents to observe
        self.observation_space = spaces.Box(
            low=np.array([0, 0, 0, 0, 0, 0, 0]), # min_hp, min_opp_hp, min_dist, min_x, min_y, min_state, min_opp_state
            high=np.array([INITIAL_HEALTH, INITIAL_HEALTH, SCREEN_WIDTH, SCREEN_WIDTH, SCREEN_HEIGHT, 5, 5]), # max_hp, max_opp_hp, max_dist, max_x, max_y, max_state, max_opp_state
            dtype=np.float32
        )

        # Action: idle, left, right, jump, attack, guard
        # Now action space is MultiDiscrete for two agents
        self.action_space = spaces.MultiDiscrete([6, 6])

        self.game: Game = Game(SCREEN_WIDTH, SCREEN_HEIGHT, "FightingEnv", headless=headless) # Pass headless to Game
        self.player_agent: Player = self.game.player1 # RL agent controls player1
        self.opponent_player: Player = self.game.player2 # Now also controlled by an RL agent

        # Tracking variables for reward calculation for both agents
        self.last_player1_health: int = INITIAL_HEALTH
        self.last_player2_health: int = INITIAL_HEALTH
        self.last_distance: float = 0.0 # Will be set in reset

        self.reward_calculator = RewardCalculator()
        self.simulation_manager = SimulationManager(fps=FPS, seed=seed)
        
        self.clock = self.simulation_manager.get_clock()

    def _get_obs(self) -> np.ndarray:
        """
        현재 게임 상태를 관측(Observation)으로 변환합니다。
        """
        game_state_dict = get_game_state(self.player_agent, self.opponent_player) # Agent is player1 in get_game_state

        # Map state strings to integers
        state_map = {"idle": 0, "walk": 1, "jump": 2, "attack": 3, "guard": 4, "hit": 5, "guard_hit": 5}

        obs = np.array([
            game_state_dict["player1"]["health"], # Player1's health
            game_state_dict["player2"]["health"], # Player2's health
            game_state_dict["distance"],
            game_state_dict["player1"]["x"],
            game_state_dict["player1"]["y"],
            state_map.get(game_state_dict["player1"]["state"], 0),
            state_map.get(game_state_dict["player2"]["state"], 0),
        ], dtype=np.float32)
        return obs

    def reset(self) -> np.ndarray:
        """
        환경을 초기화하고 초기 관측(Observation)을 반환합니다。
        """
        self.game.reset_game_state()
        
        self.player_agent = self.game.player1
        self.opponent_player = self.game.player2

        # Initialize tracking variables for reward calculation
        self.last_player1_health = self.player_agent.health
        self.last_player2_health = self.opponent_player.health
        self.last_distance = abs(self.player_agent.rect.centerx - self.opponent_player.rect.centerx)

        return self._get_obs()

    def step(self, actions: Tuple[int, int]) -> Tuple[np.ndarray, Tuple[float, float], Tuple[bool, bool], Dict[str, Any]]:
        """
        두 에이전트의 행동을 게임에 적용하고 다음 상태, 보상, 종료 여부를 반환합니다。
        """
        action_p1, action_p2 = actions

        action_map = {
            0: "idle",
            1: "move_left",
            2: "move_right",
            3: "jump",
            4: "attack",
            5: "guard"
        }
        apply_ai_action(self.player_agent, action_map[action_p1])
        apply_ai_action(self.opponent_player, action_map[action_p2])

        dt = self.simulation_manager.get_fixed_timestep()
        self.game._update(dt)

        # Get current game state for reward calculation
        player1_health_current = self.player_agent.health
        player2_health_current = self.opponent_player.health
        current_distance = abs(self.player_agent.rect.centerx - self.opponent_player.rect.centerx)

        # Determine if round is over for each player
        done_p1_step = False
        done_p2_step = False
        player1_won = False
        player2_won = False

        if player2_health_current <= 0:
            done_p1_step = True # Player1's episode ends if opponent is defeated
            player1_won = True
            done_p2_step = True # Player2's episode also ends
            player2_won = False
        elif player1_health_current <= 0:
            done_p1_step = True # Player1's episode ends if defeated
            player1_won = False
            done_p2_step = True # Player2's episode also ends
            player2_won = True
        
        game_info_p1 = {
            "round_over": done_p1_step,
            "player_won": player1_won
        }
        game_info_p2 = {
            "round_over": done_p2_step,
            "player_won": player2_won
        }

        # Calculate rewards for each player
        reward_p1 = self.reward_calculator.calculate_reward(
            player_state={"health": player1_health_current, "x": self.player_agent.rect.centerx},
            opponent_state={"health": player2_health_current, "x": self.opponent_player.rect.centerx},
            game_info=game_info_p1,
            action=action_p1,
            last_player_health=self.last_player1_health,
            last_opponent_health=self.last_player2_health,
            last_distance=self.last_distance
        )

        # Reward for player2 is inverse of player1's reward (zero-sum game assumption)
        # Or, calculate based on player2's perspective
        reward_p2 = self.reward_calculator.calculate_reward(
            player_state={"health": player2_health_current, "x": self.opponent_player.rect.centerx},
            opponent_state={"health": player1_health_current, "x": self.player_agent.rect.centerx},
            game_info=game_info_p2,
            action=action_p2,
            last_player_health=self.last_player2_health,
            last_opponent_health=self.last_player1_health,
            last_distance=self.last_distance # Distance is symmetric
        )

        # Combine rewards and done flags for single-agent compatibility
        combined_reward = reward_p1 - reward_p2 # Competitive zero-sum like
        combined_done = done_p1_step or done_p2_step
        combined_info = {"player1_info": game_info_p1, "player2_info": game_info_p2}

        # Update last known health and distance for next step
        self.last_player1_health = player1_health_current
        self.last_player2_health = player2_health_current
        self.last_distance = current_distance

        next_obs = self._get_obs()

        return next_obs, combined_reward, combined_done, combined_info

    def render(self, mode='human'):
        if not self.game.headless:
            self.game.render()

    def close(self):
        self.game.close()
