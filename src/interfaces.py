from typing import Dict, Any
from src.player import Player

def get_game_state(player1: Player, player2: Player) -> Dict[str, Any]:
    """
    현재 게임의 모든 관련 상태(캐릭터 위치, 체력, 상태, 거리 등)를
    PyTorch AI 모델이 이해할 수 있는 딕셔너리 형태로 반환합니다.

    Args:
        player1 (Player): Player 1 객체.
        player2 (Player): Player 2 객체.

    Returns:
        Dict[str, Any]: 게임 상태 딕셔너리.
    """
    state = {
        "player1": {
            "x": player1.rect.x,
            "y": player1.rect.y,
            "vel_x": player1.vel_x,
            "vel_y": player1.vel_y,
            "health": player1.health,
            "state": player1.state,
            "facing": player1.facing,
            "is_jumping": player1.is_jumping,
            "is_attacking": player1.is_attacking,
            "is_guarding": player1.is_guarding,
            "attack_hitbox_active": player1.attack_hitbox.active
        },
        "player2": {
            "x": player2.rect.x,
            "y": player2.rect.y,
            "vel_x": player2.vel_x,
            "vel_y": player2.vel_y,
            "health": player2.health,
            "state": player2.state,
            "facing": player2.facing,
            "is_jumping": player2.is_jumping,
            "is_attacking": player2.is_attacking,
            "is_guarding": player2.is_guarding,
            "attack_hitbox_active": player2.attack_hitbox.active
        },
        "distance": abs(player1.rect.centerx - player2.rect.centerx)
    }
    return state

def apply_ai_action(player: Player, action: str) -> None:
    """
    PyTorch AI 모델이 결정한 행동 문자열을 받아,
    해당 `Player` 객체의 적절한 메서드를 호출하여 게임에 반영합니다.

    Args:
        player (Player): 행동을 적용할 Player 객체.
        action (str): AI가 결정한 행동 문자열.
    """
    print(f"[apply_ai_action] Player {player.color} applying action: {action}")
    if action == "move_left":
        player.move(-1)
    elif action == "move_right":
        player.move(1)
    elif action == "jump":
        player.jump()
    elif action == "attack":
        player.attack()
    elif action == "guard":
        player.guard()
    elif action == "idle":
        player.vel_x = 0
        player.is_guarding = False
