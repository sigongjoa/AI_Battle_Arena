
import argparse
import time
from stable_baselines3 import PPO
from src.rl_training.environment import FightingEnv # 훈련 때 사용한 환경을 그대로 재사용

def parse_args():
    parser = argparse.ArgumentParser(description="Run a battle with a trained RL agent.")
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="Path to the trained PPO model (.zip file)."
    )
    parser.add_argument(
        "--peer_id",
        type=str,
        default="battle-runner-1",
        help="The Peer ID for this battle runner to register with the signaling server."
    )
    return parser.parse_args()

def main():
    args = parse_args()

    print("--- AI Battle Runner ---")
    print(f"모델 파일: {args.model}")
    print(f"Peer ID: {args.peer_id}")
    print("------------------------")

    # 3.1. 환경 초기화 (훈련 때와 동일)
    print("게임 환경(FightingEnv)을 초기화합니다...")
    print("프론트엔드 웹페이지에 접속하여 이 Peer ID로 연결해주세요.")
    try:
        env = FightingEnv(backend_peer_id=args.peer_id)
    except Exception as e:
        print(f"환경 생성 중 오류 발생: {e}")
        return

    # 3.2. 학습된 AI 모델 로드
    print(f"학습된 AI 모델({args.model})을 로드합니다...")
    try:
        model = PPO.load(args.model, env=env)
        print("모델 로드 완료.")
    except Exception as e:
        print(f"모델 로드 중 오류 발생: {e}")
        env.close()
        return

    # 3.3. 대전 실행 루프
    print("대전 시작! (게임이 끝날 때까지 실행됩니다)")
    obs = env.reset() # 환경 초기화 및 첫 번째 관찰(observation) 받아오기
    
    try:
        while True:
            # 모델을 사용해 다음 행동 예측 (deterministic=True는 가장 확률 높은 행동만 선택)
            action, _states = model.predict(obs, deterministic=True)

            # 예측한 행동을 환경(게임)에 전달하고 다음 상태 받기
            obs, reward, done, info = env.step(action)

            # 'done'이 True이면 게임 한 판이 끝났다는 의미
            if done:
                print("대전 종료! 보상(Reward):", reward)
                break
            
            # (선택사항) 각 스텝의 정보 출력
            # print(f"Action: {action}, Reward: {reward}")

    except KeyboardInterrupt:
        print("\n사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"대전 실행 중 오류 발생: {e}")
    finally:
        # 3.4. 환경 종료
        print("정리 및 환경 종료...")
        env.close()
        print("프로그램을 종료합니다.")

if __name__ == "__main__":
    main()
