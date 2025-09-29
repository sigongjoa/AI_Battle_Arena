import pygame
from typing import Tuple, Any
from src.constants import (
    SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT,
    PLAYER_SPEED, JUMP_VELOCITY, GRAVITY, INITIAL_HEALTH,
    PUNCH_DAMAGE, ATTACK_DURATION, PUNCH_COOLDOWN, HIT_STUN_DURATION,
    RED, GREEN, BLUE, YELLOW, BLACK, GRAY
)
from src.hitbox import Hitbox

class Player:
    """
    게임 내 캐릭터의 상태, 움직임, 공격, 체력 등을 관리하는 클래스.

    Attributes:
        rect (pygame.Rect): 캐릭터의 위치와 크기.
        vel_x (float): X축 속도.
        vel_y (float): Y축 속도.
        health (int): 현재 체력.
        state (str): 현재 상태 (예: "idle", "walk", "jump", "attack", "guard", "hit").
        facing (int): 바라보는 방향 (1: 오른쪽, -1: 왼쪽).
        is_jumping (bool): 점프 중인지 여부.
        is_attacking (bool): 공격 중인지 여부.
        is_guarding (bool): 가드 중인지 여부.
        attack_hitbox (Hitbox): 현재 공격의 히트박스 객체 (공격 중일 때만 유효).
        hurtbox (Hitbox): 캐릭터의 피격 판정 박스.
        color (Tuple[int, int, int]): 캐릭터의 색상.
        attack_timer (float): 공격 지속 시간 타이머.
        punch_cooldown_timer (float): 펀치 쿨다운 타이머.
    """

    def __init__(self, x: int, y: int, width: int, height: int, color: Tuple[int, int, int], facing: int):
        """
        Player 객체를 초기화합니다.

        Args:
            x (int): 캐릭터의 초기 x 좌표.
            y (int): 캐릭터의 초기 y 좌표.
            width (int): 캐릭터의 너비.
            height (int): 캐릭터의 높이.
            color (Tuple[int, int, int]): 캐릭터의 색상.
            facing (int): 캐릭터의 초기 방향 (1: 오른쪽, -1: 왼쪽).
        """
        self.rect: pygame.Rect = pygame.Rect(x, y, width, height)
        self._pos_x: float = float(x)
        self._pos_y: float = float(y)
        self.vel_x: float = 0
        self.vel_y: float = 0
        self.health: int = INITIAL_HEALTH
        self.state: str = "idle"
        self.facing: int = facing
        self.is_jumping: bool = False
        self.is_attacking: bool = False
        self.is_guarding: bool = False
        self.color: Tuple[int, int, int] = color

        # Hitboxes
        self.hurtbox: Hitbox = Hitbox(x, y, width, height)
        self.hurtbox.active = True # Hurtbox should always be active for collision detection
        # Attack hitbox (initially inactive and positioned relative to player)
        self.attack_hitbox: Hitbox = Hitbox(0, 0, width // 1.5, height // 4, damage=PUNCH_DAMAGE)
        self.attack_hitbox.active = False

        self.attack_timer: float = 0.0
        self.punch_cooldown_timer: float = 0.0
        self.hit_stun_timer: float = 0.0
        self.hit_text_timer: float = 0.0
        self.font = pygame.font.Font(None, 36) # Increased font size

    def move(self, direction: int) -> None:
        """
        캐릭터를 좌우로 이동시킵니다.

        Args:
            direction (int): 이동 방향 (-1: 왼쪽, 1: 오른쪽).
        """
        if not self.is_attacking and not self.is_guarding:
            self.vel_x = direction * PLAYER_SPEED
            self.facing = direction
            print(f"[Player.move] Player {self.color} moving {direction}. vel_x={self.vel_x}")

    def jump(self) -> None:
        """
        캐릭터를 점프시킵니다.
        """
        if not self.is_jumping and not self.is_attacking and not self.is_guarding:
            self.vel_y = JUMP_VELOCITY
            self.is_jumping = True
            print(f"[Player.jump] Player {self.color} jumping. vel_y={self.vel_y}")

    def attack(self) -> None:
        """
        공격 동작을 시작합니다.
        """
        if not self.is_attacking and self.punch_cooldown_timer <= 0:
            self.state = "attack"
            self.is_attacking = True
            self.attack_hitbox.active = True
            self.attack_timer = ATTACK_DURATION
            self.punch_cooldown_timer = PUNCH_COOLDOWN
            print(f"[Player.attack] Player {self.color} started attack. is_attacking={self.is_attacking}, hitbox_active={self.attack_hitbox.active}")

    def guard(self) -> None:
        """
        가드 동작을 시작합니다.
        """
        if not self.is_attacking and not self.is_jumping:
            self.state = "guard"
            self.is_guarding = True
            print(f"[Player.guard] Player {self.color} guarding.")

    def take_damage(self, damage: int) -> None:
        """
        캐릭터가 데미지를 입습니다.

        Args:
            damage (int): 받을 데미지 양.
        """
        initial_health = self.health
        if self.is_guarding:
            self.health -= damage // 2  # Half damage when guarding
            self.state = "guard_hit"
            print(f"[Player.take_damage] Player {self.color} guarded, took {damage // 2} damage. Health: {initial_health} -> {self.health}")
        else:
            self.health -= damage
            self.state = "hit"
            print(f"[Player.take_damage] Player {self.color} took {damage} damage. Health: {initial_health} -> {self.health}")
        if self.health < 0:
            self.health = 0
        self.hit_stun_timer = HIT_STUN_DURATION
        self.hit_text_timer = HIT_STUN_DURATION * 2 # Display HIT! for longer
        # print(f"Player {self.color} took {damage} damage. Hit text timer set to {self.hit_text_timer}") # Original print

    def update(self, dt: float, opponent: 'Player') -> None:
        """
        캐릭터의 물리 및 상태를 업데이트합니다.

        Args:
            dt (float): 마지막 프레임 이후 경과 시간 (델타 타임).
            opponent (Player): 상대방 캐릭터 객체 (충돌 감지용).
        """
        print(f"[Player.update] Player {self.color} state={self.state}, is_attacking={self.is_attacking}, is_guarding={self.is_guarding}, hit_stun_timer={self.hit_stun_timer:.2f}")
        # Update hit stun timer
        if self.hit_stun_timer > 0:
            self.hit_stun_timer -= dt
            if self.hit_stun_timer <= 0:
                self.state = "idle" # Exit hit stun
                print(f"[Player.update] Player {self.color} exited hit stun.")

        # Update hit text timer
        if self.hit_text_timer > 0:
            self.hit_text_timer -= dt

        # Restrict actions during hit stun
        if self.hit_stun_timer > 0:
            self.vel_x = 0
            self.vel_y = 0
            self.is_attacking = False
            self.attack_hitbox.active = False
            self.is_guarding = False
            return # Skip other updates if in hit stun

        # Apply gravity
        # print(f"Before gravity: vel_y={self.vel_y}, _pos_y={self._pos_y}, rect.y={self.rect.y}") # Original print
        self.vel_y += GRAVITY * dt
        self._pos_x += self.vel_x * dt
        self._pos_y += self.vel_y * dt
        self.rect.x = int(self._pos_x)
        self.rect.y = int(self._pos_y)
        # print(f"After gravity: vel_y={self.vel_y}, _pos_y={self._pos_y}, rect.y={self.rect.y}") # Original print

        # Stop horizontal movement if no input
        if self.state not in ["attack", "hit", "guard_hit"] and not self.is_guarding:
            self.vel_x = 0

        # Keep player on screen
        if self.rect.left < 0:
            self.rect.left = 0
        if self.rect.right > SCREEN_WIDTH:
            self.rect.right = SCREEN_WIDTH

        # Ground collision
        if self.rect.bottom > SCREEN_HEIGHT:
            self._pos_y = SCREEN_HEIGHT - self.rect.height
            self.rect.y = int(self._pos_y)
            self.vel_y = 0
            self.is_jumping = False
            if self.state == "jump":
                self.state = "idle"

        # Update hurtbox position
        self.hurtbox.rect.topleft = self.rect.topleft

        # Update attack state and timer
        if self.is_attacking:
            # print(f"Player {self.color} update: Before attack_timer check. is_attacking={self.is_attacking}, hitbox_active={self.attack_hitbox.active}, attack_timer={self.attack_timer}") # Original print
            self.attack_timer -= dt
            if self.attack_timer <= 0:
                self.is_attacking = False
                self.attack_hitbox.active = False
                if self.state == "attack":
                    self.state = "idle"
                print(f"[Player.update] Player {self.color} attack ended. is_attacking={self.is_attacking}, hitbox_active={self.attack_hitbox.active}")
            else:
                # Position attack hitbox relative to player and facing direction
                offset_x = self.rect.width if self.facing == 1 else -self.attack_hitbox.rect.width
                self.attack_hitbox.update_position(self.rect, offset_x, self.rect.height // 4, self.facing)
                # print(f"Player {self.color} update: Attack ongoing. is_attacking={self.is_attacking}, hitbox_active={self.attack_hitbox.active}") # Original print
        
        # Update punch cooldown
        if self.punch_cooldown_timer > 0:
            self.punch_cooldown_timer -= dt

        # Reset guard state
        if self.is_guarding and self.state != "guard_hit":
            self.state = "guard"
        elif not self.is_guarding and self.state == "guard":
            self.state = "idle"
        elif self.state == "hit" or self.state == "guard_hit":
            # Simple hit stun for now, transition back to idle after a short delay
            # In a real game, this would involve animation states and recovery frames
            pass # Handled by external logic or animation system
        elif not self.is_attacking and not self.is_jumping and not self.is_guarding and self.state not in ["hit", "guard_hit"]:
            self.state = "idle"


    def draw(self, screen: pygame.Surface) -> None:
        """
        캐릭터를 화면에 그립니다.

        Args:
            screen (pygame.Surface): 그릴 화면.
        """
        # Draw player body
        current_color = self.color
        if self.is_attacking:
            current_color = YELLOW # Attack color
        elif self.is_guarding:
            current_color = GRAY # Guard color
        elif self.state == "hit" or self.state == "guard_hit":
            current_color = RED # Hit color

        pygame.draw.rect(screen, current_color, self.rect)

        # Draw attack hitbox if active
        if self.attack_hitbox.active:
            pygame.draw.rect(screen, YELLOW, self.attack_hitbox.rect)

        # Draw hurtbox (for debugging)
        pygame.draw.rect(screen, BLUE, self.hurtbox.rect, 1)

        # Indicate facing direction
        triangle_points = []
        if self.facing == 1: # Facing right
            triangle_points = [
                (self.rect.centerx + self.rect.width // 4, self.rect.centery - self.rect.height // 4),
                (self.rect.centerx + self.rect.width // 2, self.rect.centery),
                (self.rect.centerx + self.rect.width // 4, self.rect.centery + self.rect.height // 4),
            ]
        else: # Facing left
            triangle_points = [
                (self.rect.centerx - self.rect.width // 4, self.rect.centery - self.rect.height // 4),
                (self.rect.centerx - self.rect.width // 2, self.rect.centery),
                (self.rect.centerx - self.rect.width // 4, self.rect.centery + self.rect.height // 4),
            ]
        pygame.draw.polygon(screen, BLACK, triangle_points)

        # Draw 'HIT!' text if hit_text_timer is active
        if self.hit_text_timer > 0:
            hit_text_surface = self.font.render("HIT!", True, BLACK)
            screen.blit(hit_text_surface, (self.rect.centerx - hit_text_surface.get_width() // 2, self.rect.y - 30))
