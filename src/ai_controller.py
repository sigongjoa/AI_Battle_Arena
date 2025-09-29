import random
from typing import Tuple, Any
from src.player import Player
from src.constants import AI_ACTION_INTERVAL
from src.interfaces import get_game_state

class AIController:
    """
    P2 캐릭터의 행동을 결정하고 게임에 주입하는 클래스.
    """

    def __init__(self, player: Player, opponent: Player):
        """
        AIController 객체를 초기화합니다.

        Args:
            player (Player): 제어할 캐릭터 객체 (AI).
            opponent (Player): 상대방 캐릭터 객체 (Player 1).
        """
        self.player: Player = player
        self.opponent: Player = opponent
        self.action_timer: float = 0.0
        self.current_move_direction: int = 0 # 0: no movement, -1: left, 1: right

    def update(self, dt: float) -> None:
        """
        게임 상태를 기반으로 AI의 다음 행동을 결정하고, 해당 행동을 `player` 객체에 지시합니다.

        Args:
            dt (float): 마지막 프레임 이후 경과 시간 (델타 타임).
        """
        self.action_timer -= dt
        if self.action_timer <= 0:
            action = self._decide_action()
            self._apply_action(action)
            self.action_timer = AI_ACTION_INTERVAL + random.uniform(-0.1, 0.1) # Add some randomness

        # Apply continuous movement based on current_move_direction
        if self.current_move_direction != 0:
            self.player.move(self.current_move_direction)
        else:
            self.player.vel_x = 0

    def _decide_action(self) -> str:
        """
        현재 게임 상태를 기반으로 AI가 취할 행동(예: "jump", "attack", "move_left")을 결정합니다.
        (초기에는 무작위 또는 단순 규칙).

        Returns:
            str: 결정된 행동 문자열.
        """
        # Get current game state
        game_state = get_game_state(self.opponent, self.player) # Note: opponent is player1, self.player is player2

        player_state = game_state["player2"]
        opponent_state = game_state["player1"]
        distance = game_state["distance"]

        # Simple FSM-like AI logic
        if player_state["health"] <= 0 or opponent_state["health"] <= 0:
            return "idle" # Game over, do nothing

        # If attacking or in hit stun, continue current action or recover
        if self.player.is_attacking or self.player.hit_stun_timer > 0:
            return "idle" # Let current action finish or recover

        # Decision making
        move_decision = 0
        if distance < 80: # Very close range, high chance to attack
            if random.random() < 0.8: 
                return "attack"
            elif random.random() < 0.2: # Small chance to guard
                return "guard"
            else:
                move_decision = random.choice([-1, 1])
        elif distance > 150: # Long range, always move towards opponent
            if player_state["x"] < opponent_state["x"]:
                move_decision = 1
            else:
                move_decision = -1
        else: # Mid range
            if random.random() < 0.6: # Good chance to attack
                return "attack"
            elif random.random() < 0.3: # Moderate chance to jump
                return "jump"
            elif random.random() < 0.2: # Small chance to guard
                return "guard"
            else:
                if player_state["x"] < opponent_state["x"]:
                    move_decision = 1
                else:
                    move_decision = -1
        
        self.current_move_direction = move_decision
        return "move"
    def _apply_action(self, action: str) -> None:
        """
        AI가 결정한 행동을 `player` 객체에 적용합니다.

        Args:
            action (str): AI가 결정한 행동 문자열.
        """
        if action == "jump":
            self.player.jump()
        elif action == "attack":
            self.player.attack()
        elif action == "guard":
            self.player.guard()
        elif action == "idle":
            self.player.is_guarding = False
