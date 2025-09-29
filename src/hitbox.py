import pygame
from typing import Tuple

class Hitbox:
    """
    충돌 판정을 위한 사각형 영역을 정의하는 클래스.

    Attributes:
        rect (pygame.Rect): 히트박스의 위치와 크기.
        damage (int): 이 히트박스가 주는 데미지 (공격용).
        active (bool): 히트박스 활성화 여부.
    """

    def __init__(self, x: int, y: int, width: int, height: int, damage: int = 0):
        """
        Hitbox 객체를 초기화합니다.

        Args:
            x (int): 히트박스의 좌측 상단 x 좌표.
            y (int): 히트박스의 좌측 상단 y 좌표.
            width (int): 히트박스의 너비.
            height (int): 히트박스의 높이.
            damage (int): 이 히트박스가 주는 데미지. 기본값은 0.
        """
        self.rect: pygame.Rect = pygame.Rect(x, y, width, height)
        self.damage: int = damage
        self.active: bool = False

    def update_position(self, parent_rect: pygame.Rect, offset_x: int, offset_y: int, facing: int) -> None:
        """
        부모 객체(캐릭터)의 위치와 방향에 따라 히트박스 위치를 업데이트합니다.

        Args:
            parent_rect (pygame.Rect): 부모 객체의 Rect.
            offset_x (int): 부모 객체로부터의 x축 오프셋.
            offset_y (int): 부모 객체로부터의 y축 오프셋.
            facing (int): 부모 객체의 방향 (1: 오른쪽, -1: 왼쪽).
        """
        if facing == 1:  # Facing right
            self.rect.x = parent_rect.x + offset_x
        else:  # Facing left
            self.rect.x = parent_rect.x + parent_rect.width - offset_x - self.rect.width
        self.rect.y = parent_rect.y + offset_y

    def is_colliding(self, other_hitbox: 'Hitbox') -> bool:
        print(f"Hitbox.is_colliding: self.active={self.active}, other_hitbox.active={other_hitbox.active}")
        print(f"Hitbox.is_colliding: self.rect={self.rect}, other_hitbox.rect={other_hitbox.rect}")
        return self.active and other_hitbox.active and self.rect.colliderect(other_hitbox.rect)
