from typing import Dict, Any

class RewardCalculator:
    """
    강화학습 에이전트의 행동과 환경 상태 변화에 따른 보상을 계산하는 클래스.
    다양한 보상 요소를 통합하여 최종 보상을 산출합니다.
    """

    def __init__(self,
                 damage_reward_scale: float = 0.1,
                 damage_penalty_scale: float = 0.1,
                 win_reward: float = 100.0,
                 loss_penalty: float = -100.0,
                 distance_closer_reward_scale: float = 0.001,
                 distance_further_penalty_scale: float = 0.0005,
                 idle_penalty: float = 0.0): # Changed to 0.0 as per previous step's logic
        self.damage_reward_scale = damage_reward_scale
        self.damage_penalty_scale = damage_penalty_scale
        self.win_reward = win_reward
        self.loss_penalty = loss_penalty
        self.distance_closer_reward_scale = distance_closer_reward_scale
        self.distance_further_penalty_scale = distance_further_penalty_scale
        self.idle_penalty = idle_penalty

    def calculate_reward(self,
                         player_state: Dict[str, Any],
                         opponent_state: Dict[str, Any],
                         game_info: Dict[str, Any],
                         action: int, # Agent's action
                         last_player_health: int,
                         last_opponent_health: int,
                         last_distance: float) -> float:
        """
        현재 게임 상태를 기반으로 보상을 계산하여 반환합니다.
        """
        reward = 0.0

        # 1. Damage dealt/taken reward
        damage_dealt = last_opponent_health - opponent_state["health"]
        if damage_dealt > 0:
            reward += damage_dealt * self.damage_reward_scale

        damage_taken = last_player_health - player_state["health"]
        if damage_taken > 0:
            reward -= damage_taken * self.damage_penalty_scale

        # 2. Win/Loss reward
        if game_info["round_over"]:
            if game_info["player_won"]:
                reward += self.win_reward
            else:
                reward += self.loss_penalty

        # 3. Distance reward/penalty
        current_distance = abs(player_state["x"] - opponent_state["x"])
        distance_change = last_distance - current_distance # Positive if distance decreased

        if distance_change > 0: # Moving closer
            reward += distance_change * self.distance_closer_reward_scale
        elif distance_change < 0: # Moving further
            reward -= abs(distance_change) * self.distance_further_penalty_scale
        
        # 4. Idle penalty (if applicable)
        if action == 0: # Assuming 0 is the idle action
            reward += self.idle_penalty

        return reward

    # Internal reward components (can be used for more granular control if needed)
    def _distance_reward(self, player_pos_x: float, opponent_pos_x: float, last_distance: float) -> float:
        current_distance = abs(player_pos_x - opponent_pos_x)
        distance_change = last_distance - current_distance
        if distance_change > 0:
            return distance_change * self.distance_closer_reward_scale
        elif distance_change < 0:
            return abs(distance_change) * self.distance_further_penalty_scale
        return 0.0

    def _health_difference_reward(self, player_health: int, opponent_health: int) -> float:
        # This can be added later if needed, currently covered by damage dealt/taken
        # Example: reward += (player_health - opponent_health) * some_scale
        return 0.0

    def _win_loss_reward(self, is_round_over: bool, player_won: bool) -> float:
        if is_round_over:
            if player_won:
                return self.win_reward
            else:
                return self.loss_penalty
        return 0.0

    def _attack_success_reward(self, attack_hit: bool) -> float:
        # This would require more detailed game state to track if an attack specifically landed
        # Currently covered by damage_dealt
        return 0.0
