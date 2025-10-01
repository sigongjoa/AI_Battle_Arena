
import sys
try:
    import gymnasium as gym
    print(f"gym found at: {gym.__file__}")
except ImportError:
    print(f"gym not found. Python executable: {sys.executable}")
    print(f"Python path: {sys.path}")
