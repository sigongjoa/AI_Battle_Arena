from typing import Tuple
from src.game_engine.player import Player


class CollisionManager:
    """
    게임 내 모든 충돌을 감지하고 처리하는 클래스.
    """

    def __init__(self):
        """
        CollisionManager 객체를 초기화합니다.
        """
        pass

    def check_player_attack(self, attacker: Player, defender: Player) -> None:
        """
        공격자와 방어자 간의 공격 충돌을 감지하고 데미지를 처리합니다.

        Args:
            attacker (Player): 공격자 캐릭터 객체.
            defender (Player): 방어자 캐릭터 객체.
        """
        print(
            f"CollisionManager: Checking attack from {attacker.color} to {defender.color}"
        )
        if attacker.is_attacking and attacker.attack_hitbox.active:
            print(
                f"CollisionManager: Attacker {attacker.color} is attacking and hitbox is active."
            )
            if attacker.attack_hitbox.is_colliding(defender.hurtbox):
                print(
                    f"CollisionManager: Hitbox rect={attacker.attack_hitbox.rect}, Hurtbox rect={defender.hurtbox.rect}"
                )
                print(
                    f"CollisionManager: Collision detected! Attacker {attacker.color} hitbox with Defender {defender.color} hurtbox."
                )
                if attacker.color == (255, 0, 0) and defender.color == (
                    0,
                    0,
                    255,
                ):  # If Player 2 attacks Player 1
                    print("Player 2 attack collided with Player 1 hurtbox!")
                # Ensure damage is applied only once per attack
                if defender.state not in ["hit", "guard_hit"] or (
                    defender.state == "guard_hit" and not defender.is_guarding
                ):
                    print(f"CollisionManager: Defender {defender.color} taking damage.")
                    defender.take_damage(attacker.attack_hitbox.damage)
                    attacker.attack_hitbox.active = False  # Deactivate hitbox after hit
