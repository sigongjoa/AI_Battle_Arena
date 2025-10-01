import pygame
from typing import Tuple, Any
from src.constants import (
    SCREEN_WIDTH, SCREEN_HEIGHT, CAPTION, FPS, WHITE, BLACK, RED, BLUE, GREEN,
    PLAYER_WIDTH, PLAYER_HEIGHT, INITIAL_HEALTH,
    HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, HEALTH_BAR_MARGIN
)
from src.player import Player
from src.collision_manager import CollisionManager
from src.ai_controller import AIController
from src.interfaces import get_game_state, apply_ai_action

class Game:
    """
    Pygame 초기화, 메인 게임 루프 관리, 이벤트 처리, 게임 상태 업데이트 및 렌더링을 담당하는 핵심 클래스.
    """

    def __init__(self, width: int, height: int, caption: str, headless: bool = False):
        """
        Game 객체를 초기화합니다.

        Args:
            width (int): 화면 너비.
            height (int): 화면 높이.
            caption (str): 창 제목.
            headless (bool): True이면 Pygame 디스플레이를 초기화하지 않습니다.
        """
        self.headless = headless
        if not self.headless:
            pygame.init()
            pygame.font.init() # Initialize font module
            self.screen: pygame.Surface = pygame.display.set_mode((width, height))
            pygame.display.set_caption(caption)
        else:
            # Initialize Pygame modules that don't require a display
            pygame.init()
            pygame.font.init() # Initialize font module
            pygame.display.set_mode((1, 1), pygame.HIDDEN) # Create a minimal hidden display

        self.clock: pygame.time.Clock = pygame.time.Clock()
        self.running: bool = True

        self.player1: Player = Player(100, SCREEN_HEIGHT - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, BLUE, 1)
        self.player2: Player = Player(SCREEN_WIDTH - 100 - PLAYER_WIDTH, SCREEN_HEIGHT - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, RED, -1)

        self.collision_manager: CollisionManager = CollisionManager()
        self.frame_count: int = 0
        self.round_timer: int = 99
        self.timer_accumulator: float = 0.0
        # self.ai_controller: AIController = AIController(self.player2, self.player1) # Disabled for multi-agent control

    def reset_game_state(self) -> None:
        """
        게임의 상태를 초기화합니다. Pygame 자체는 종료하지 않습니다.
        """
        self.player1 = Player(100, SCREEN_HEIGHT - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, BLUE, 1)
        self.player2 = Player(SCREEN_WIDTH - 100 - PLAYER_WIDTH, SCREEN_HEIGHT - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, RED, -1)
        self.collision_manager = CollisionManager() # Re-initialize collision manager if it holds state
        # self.ai_controller = AIController(self.player2, self.player1) # Disabled for multi-agent control
        self.running = True # Ensure game loop can run

    def run(self) -> None:
        """
        메인 게임 루프를 실행합니다. 이벤트 처리, 업데이트, 그리기를 반복합니다.
        """
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0  # Delta time in seconds
            if not self.headless:
                self._handle_input()
            self._update(dt)
            if not self.headless:
                self._draw()

        pygame.quit()

    def _handle_input(self) -> None:
        """
        Pygame 이벤트(키보드 입력, 창 닫기 등)를 처리합니다.
        """
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    self.player1.jump()
                elif event.key == pygame.K_SPACE:
                    self.player1.attack()
                elif event.key == pygame.K_DOWN:
                    self.player1.guard()
            elif event.type == pygame.KEYUP:
                if event.key == pygame.K_DOWN:
                    self.player1.is_guarding = False

        # Check for continuous key presses for movement
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            self.player1.move(-1)
        elif keys[pygame.K_RIGHT]:
            self.player1.move(1)
        else:
            # Stop horizontal movement if no left/right key is pressed
            # Only if not attacking or guarding, as those states might override movement
            if not self.player1.is_attacking and not self.player1.is_guarding:
                self.player1.vel_x = 0

    def _update(self, dt: float) -> None:
        """
        게임 로직을 업데이트합니다 (캐릭터 위치, 상태, AI 행동 결정 등).

        Args:
            dt (float): 마지막 프레임 이후 경과 시간 (델타 타임).
        """
        print(f"[Game._update] Updating players and AI. dt={dt:.4f}")
        self.frame_count += 1

        # Update timer
        self.timer_accumulator += dt
        if self.timer_accumulator >= 1.0:
            self.round_timer -= 1
            self.timer_accumulator -= 1.0
            if self.round_timer < 0:
                self.round_timer = 0
                self.running = False # Game over on time out
        self.player1.update(dt, self.player2)
        self.player2.update(dt, self.player1)

        # self.ai_controller.update(dt) # Disabled for multi-agent control

        print(f"[Game._update] Checking collisions.")
        self.collision_manager.check_player_attack(self.player1, self.player2)
        self.collision_manager.check_player_attack(self.player2, self.player1)

        # Check for game over condition
        if self.player1.health <= 0 or self.player2.health <= 0:
            print(f"[Game._update] Game Over! Player1 Health: {self.player1.health}, Player2 Health: {self.player2.health}")
            self.running = False

    def _draw_health_bar(self, player: Player, x: int, y: int, screen: pygame.Surface) -> None:
        """
        Draws a health bar for a given player at a specified position.

        Args:
            player (Player): The player whose health bar is to be drawn.
            x (int): The x-coordinate of the top-left corner of the health bar.
            y (int): The y-coordinate of the top-left corner of the health bar.
            screen (pygame.Surface): The surface to draw on.
        """
        # Background bar (red)
        pygame.draw.rect(screen, RED, (x, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT))

        # Current health (green)
        current_health_width = int(HEALTH_BAR_WIDTH * (player.health / INITIAL_HEALTH))
        pygame.draw.rect(screen, GREEN, (x, y, current_health_width, HEALTH_BAR_HEIGHT))

        # Border
        pygame.draw.rect(screen, BLACK, (x, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT), 2) # 2 pixels thick border

    def _draw(self) -> None:
        """
        모든 게임 객체를 화면에 그립니다.
        """
        self.screen.fill(WHITE)  # Fill background

        self.player1.draw(self.screen)
        self.player2.draw(self.screen)

        # Draw top health bars
        self._draw_health_bar(self.player1, HEALTH_BAR_MARGIN, HEALTH_BAR_MARGIN, self.screen)
        self._draw_health_bar(self.player2, SCREEN_WIDTH - HEALTH_BAR_WIDTH - HEALTH_BAR_MARGIN, HEALTH_BAR_MARGIN, self.screen)

        pygame.display.flip()  # Update the full display surface

    def render(self) -> None:
        """
        Renders all game objects to the screen.
        """
        if not self.headless:
            self._draw()

    def close(self) -> None:
        """
        Closes the Pygame display.
        """
        if not self.headless:
            pygame.quit()
