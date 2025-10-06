import pygame
import pytest

from src.constants import (ATTACK_DURATION, FPS, GRAVITY, INITIAL_HEALTH,
                           JUMP_VELOCITY, PLAYER_HEIGHT, PLAYER_SPEED,
                           PLAYER_WIDTH, PUNCH_COOLDOWN, PUNCH_DAMAGE,
                           SCREEN_HEIGHT, SCREEN_WIDTH)
from src.hitbox import Hitbox
from src.player import Player

# Pygame initialization is now handled by conftest.py fixture


@pytest.fixture
def default_player():
    pygame.init()
    pygame.font.init()
    player = Player(
        100, SCREEN_HEIGHT - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, (0, 0, 255), 1
    )
    yield player
    pygame.font.quit()
    pygame.quit()


@pytest.fixture
def opponent_player():
    return Player(
        SCREEN_WIDTH - 100 - PLAYER_WIDTH,
        SCREEN_HEIGHT - PLAYER_HEIGHT,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        (255, 0, 0),
        -1,
    )


@pytest.fixture
def default_hitbox():
    return Hitbox(0, 0, 20, 20, damage=10)


class TestPlayer:
    def test_initialization(self, default_player):
        assert default_player.health == INITIAL_HEALTH
        assert default_player.state == "idle"
        assert default_player.facing == 1
        assert not default_player.is_jumping
        assert not default_player.is_attacking
        assert not default_player.is_guarding

    def test_move(self, default_player):
        default_player.move(1)  # Move right
        assert default_player.vel_x == PLAYER_SPEED
        assert default_player.facing == 1

        default_player.move(-1)  # Move left
        assert default_player.vel_x == -PLAYER_SPEED
        assert default_player.facing == -1

    def test_jump(self, default_player):
        default_player.jump()
        assert default_player.is_jumping
        assert default_player.vel_y == JUMP_VELOCITY

    def test_attack(self, default_player):
        default_player.attack()
        assert default_player.is_attacking
        assert default_player.state == "attack"
        assert default_player.attack_hitbox.active
        assert default_player.punch_cooldown_timer == PUNCH_COOLDOWN

    def test_take_damage(self, default_player):
        initial_health = default_player.health
        default_player.take_damage(10)
        assert default_player.health == initial_health - 10
        assert default_player.state == "hit"

    def test_take_damage_guarding(self, default_player):
        initial_health = default_player.health
        default_player.guard()
        default_player.take_damage(10)
        assert default_player.health == initial_health - (10 // 2)  # Half damage
        assert default_player.state == "guard_hit"

    def test_update_gravity(self, default_player, opponent_player):
        # Start player slightly above ground to allow gravity to act
        default_player.rect.y = SCREEN_HEIGHT - PLAYER_HEIGHT - 10
        initial_y = default_player.rect.y
        default_player.is_jumping = True
        default_player.vel_y = 0  # Reset vel_y for consistent gravity test
        default_player.update(1 / FPS, opponent_player)  # Simulate one frame
        assert default_player.vel_y > 0  # Gravity should increase vel_y
        assert default_player.rect.y > initial_y  # Player should move down

    def test_update_attack_timer(self, default_player, opponent_player):
        default_player.attack()
        assert default_player.is_attacking
        default_player.update(
            ATTACK_DURATION + 0.1, opponent_player
        )  # Pass attack duration
        assert not default_player.is_attacking
        assert not default_player.attack_hitbox.active
        assert default_player.state == "idle"


class TestHitbox:
    def test_initialization(self, default_hitbox):
        assert default_hitbox.rect.x == 0
        assert default_hitbox.rect.y == 0
        assert default_hitbox.rect.width == 20
        assert default_hitbox.rect.height == 20
        assert default_hitbox.damage == 10
        assert not default_hitbox.active

    def test_update_position(self, default_hitbox):
        parent_rect = pygame.Rect(100, 100, 50, 100)
        default_hitbox.update_position(parent_rect, 10, 20, 1)  # Facing right
        assert default_hitbox.rect.x == 110
        assert default_hitbox.rect.y == 120

        default_hitbox.update_position(parent_rect, 10, 20, -1)  # Facing left
        # parent_rect.x + parent_rect.width - offset_x - self.rect.width
        # 100 + 50 - 10 - 20 = 120
        assert default_hitbox.rect.x == 120
        assert default_hitbox.rect.y == 120

    def test_is_colliding(self, default_hitbox):
        other_hitbox = Hitbox(10, 10, 20, 20)

        # No collision if not active
        assert not default_hitbox.is_colliding(other_hitbox)

        default_hitbox.active = True
        other_hitbox.active = True

        # Collision
        assert default_hitbox.is_colliding(other_hitbox)

        # No collision if moved apart
        other_hitbox.rect.x = 100
        assert not default_hitbox.is_colliding(other_hitbox)
