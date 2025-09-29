from src.game import Game
from src.constants import SCREEN_WIDTH, SCREEN_HEIGHT, CAPTION

if __name__ == "__main__":
    game = Game(SCREEN_WIDTH, SCREEN_HEIGHT, CAPTION)
    game.run()