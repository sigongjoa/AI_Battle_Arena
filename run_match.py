import argparse
import time
import webbrowser
from urllib.parse import urlencode
from stable_baselines3 import PPO
from src.fighting_env import FightingEnv

# --- Constants ---
FRONTEND_URL = "http://localhost:5174"

def parse_args():
    parser = argparse.ArgumentParser(description="Run a 2-player match with trained RL agents.")
    parser.add_argument("--model1", type=str, required=True, help="Path to the trained PPO model for Player 1.")
    parser.add_argument("--model2", type=str, default=None, help="Path to the trained PPO model for Player 2. If None, Player 2 will be a dummy.")
    parser.add_argument("--p1_peer_id", type=str, default="player1-ai", help="Peer ID for Player 1.")
    parser.add_argument("--p2_peer_id", type=str, default="player2-ai", help="Peer ID for Player 2.")
    return parser.parse_args()

def main():
    args = parse_args()
    print("--- AI Match Orchestrator ---")
    print(f"P1 Model: {args.model1}, P1 Peer: {args.p1_peer_id}")
    print(f"P2 Model: {args.model2}, P2 Peer: {args.p2_peer_id}")
    print("-----------------------------")

    # 1. Open web browser automatically
    params = {
        'mode': 'rl_training',
        'p1_peer_id': args.p1_peer_id, 
        'p2_peer_id': args.p2_peer_id
    }
    query_string = urlencode(params)
    url = f"{FRONTEND_URL}?{query_string}"
    print(f"\n[Phase 1] Opening browser at: {url}")
    webbrowser.open(url)

    env1, env2 = None, None
    try:
        # 2. Initialize environments (the frontend will now connect automatically)
        print("\n[Phase 2] Initializing environments, waiting for auto-connect...")
        env1 = FightingEnv(backend_peer_id=args.p1_peer_id)
        obs1 = env1.reset()
        print("Player 1 Connected.")

        env2 = FightingEnv(backend_peer_id=args.p2_peer_id)
        obs2 = env2.reset()
        print("Player 2 Connected.")

        # 3. Load AI models
        print("\n[Phase 3] Loading AI models...")
        model1 = PPO.load(args.model1, env=env1)
        model2 = PPO.load(args.model2, env=env2) if args.model2 else None
        print("Models loaded successfully.")

        # 4. Run the match loop
        print("\n[Phase 4] Starting the match!")
        while True:
            action1, _ = model1.predict(obs1, deterministic=True)
            obs1, reward1, done1, info1 = env1.step(action1)

            if model2:
                action2, _ = model2.predict(obs2, deterministic=True)
                obs2, reward2, done2, info2 = env2.step(action2)
            else:
                obs2, reward2, done2, info2 = env2.step([0])

            if done1 or done2:
                print("Match Finished!")
                print(f"P1 Reward: {reward1}, P2 Reward: {reward2}")
                break
                
    except Exception as e:
        print(f"\nAn error occurred: {e}")
    finally:
        print("\nCleaning up resources...")
        if env1:
            env1.close()
        if env2:
            env2.close()
        print("Orchestrator finished.")

if __name__ == "__main__":
    main()