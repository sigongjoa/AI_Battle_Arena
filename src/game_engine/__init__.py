"""
Game Engine Module

Core Pygame-based game logic including rendering, character mechanics,
collision detection, and game state management.
"""

from src.game_engine.game import Game
from src.game_engine.player import Player
from src.game_engine.collision import CollisionManager
from src.game_engine.hitbox import Hitbox
from src.game_engine.interfaces import (
    get_game_state,
    apply_ai_action,
)

__all__ = [
    "Game",
    "Player",
    "CollisionManager",
    "Hitbox",
    "get_game_state",
    "apply_ai_action",
]
