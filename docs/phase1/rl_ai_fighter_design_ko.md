# 강화학습(RL) 기반 AI 파이터 설계 기획서

## 1. 개요 (Introduction)

현재 Pygame 프로토타입에 구현된 AI는 FSM(Finite State Machine) 또는 조건 분기 기반의 휴리스틱 로직으로 동작합니다. 이는 특정 상황에 대한 규칙을 사람이 직접 정의해야 하므로, 복잡한 전략이나 유연한 대응이 어렵고 확장성에 한계가 있습니다. 본 기획서는 이러한 한계를 극복하고, AI가 스스로 최적의 격투 전략을 학습할 수 있도록 강화학습(Reinforcement Learning, RL) 기반의 AI 파이터 시스템을 설계하는 것을 목표로 합니다.

## 2. 강화학습 도입 배경 (Motivation for RL)

### 2.1. FSM/휴리스틱의 한계
*   **확장성 부족:** 새로운 행동 패턴이나 복잡한 상황에 대한 대응을 추가할 때마다 사람이 직접 규칙을 수정하고 추가해야 합니다.
*   **수동 튜닝:** AI의 성능을 개선하기 위해 수많은 파라미터와 조건들을 수동으로 조정해야 하며, 이는 비효율적입니다.
*   **예측 불가능성:** 사람이 정의한 규칙의 조합으로 인해 예상치 못한 비합리적인 행동이 발생할 수 있습니다.

### 2.2. RL의 장점
*   **자율 학습:** 보상 함수(Reward Function)만 잘 정의하면, 에이전트(AI)가 시행착오를 통해 스스로 최적의 행동 정책을 학습합니다.
*   **격투 게임과의 적합성:** 격투 게임은 명확한 상태(State), 행동(Action), 그리고 그에 따른 보상(Reward) 구조를 가지고 있어 RL 패러다임과 매우 잘 맞습니다.
*   **복잡한 전략 학습:** 사람이 예상하기 어려운 미묘하고 복잡한 전략들을 AI가 스스로 발견하고 학습할 수 있습니다.

## 3. RL 환경 정의 (Gym-style Environment Definition)

강화학습 에이전트가 상호작용할 환경은 OpenAI Gym 스타일로 `FightingEnv` 클래스를 정의하여 구현합니다. 이는 RL 알고리즘과의 표준화된 인터페이스를 제공합니다.

### 3.1. `FightingEnv` 클래스 구조

```python
import gym
from gym import spaces
import numpy as np

class FightingEnv(gym.Env):
    def __init__(self):
        super(FightingEnv, self).__init__()
        
        # Observation Space (관측 공간) 정의
        self.observation_space = spaces.Box(
            low=np.array([0, 0, 0, -1000, -1000]), # 예시: 내 체력, 상대 체력, 거리, 내 x, 내 y
            high=np.array([100, 100, 2000, 1000, 1000]), # 예시: 최대 체력, 최대 거리, 최대 x, 최대 y
            dtype=np.float32
        )
        
        # Action Space (행동 공간) 정의
        self.action_space = spaces.Discrete(6) # 6가지 이산 행동

    def reset(self):
        # 환경 초기화 로직 (게임 시작 상태로 되돌림)
        state = np.zeros(5, dtype=np.float32)  # 초기화된 상태 반환
        return state

    def step(self, action):
        # 에이전트의 행동을 게임에 적용하고 다음 상태, 보상, 종료 여부를 반환
        # 여기서 실제 게임 엔진(Pygame 프로토타입 또는 Ikemen GO)과의 인터페이스가 필요
        next_state = np.zeros(5, dtype=np.float32) # 다음 상태
        reward = 0.0 # 보상
        done = False # 에피소드 종료 여부
        info = {} # 추가 정보
        return next_state, reward, done, info
```

### 3.2. Observation Space (관측 공간) 상세화

에이전트가 현재 게임 상태를 인지하는 데 필요한 정보들을 정의합니다.
*   **내 체력 (Self HP):** `0` ~ `INITIAL_HEALTH`
*   **상대 체력 (Opponent HP):** `0` ~ `INITIAL_HEALTH`
*   **거리 (Distance):** 두 캐릭터의 X축 거리 (`0` ~ `SCREEN_WIDTH`)
*   **내 위치 (Self X, Self Y):** 내 캐릭터의 X, Y 좌표 (`0` ~ `SCREEN_WIDTH`, `0` ~ `SCREEN_HEIGHT`)
*   **내 상태 (Self State):** `idle`, `walk`, `jump`, `attack`, `guard`, `hit` 등을 원-핫 인코딩 또는 정수 매핑으로 표현 (예: 0~5)
*   **상대 상태 (Opponent State):** 위와 동일

### 3.3. Action Space (행동 공간) 상세화

에이전트가 게임 내에서 수행할 수 있는 이산적인 행동들을 정의합니다.
*   `0: idle` (아무것도 하지 않음)
*   `1: move_left` (왼쪽으로 이동)
*   `2: move_right` (오른쪽으로 이동)
*   `3: jump` (점프)
*   `4: attack` (공격)
*   `5: guard` (가드)

### 3.4. 게임 엔진 연동

`FightingEnv`의 `step()` 메서드 내에서 실제 게임 엔진(현재 Pygame 프로토타입)과 상호작용하기 위해 기존에 구현된 인터페이스를 활용합니다.
*   `get_game_state(player1, player2)`: 현재 게임의 상태를 딕셔너리 형태로 추출하여 `FightingEnv`의 `next_state`로 변환합니다.
*   `apply_ai_action(player, action)`: 에이전트가 결정한 `action`을 게임 내 `Player` 객체에 적용합니다.

## 4. 보상 함수 설계 (Reward Function Design)

강화학습의 핵심은 보상 함수 설계에 있습니다. 에이전트가 원하는 행동을 학습하도록 유도하는 보상 체계를 구축합니다.

*   **상대 HP 감소:** `+1` (상대에게 입힌 데미지량에 비례)
*   **내 HP 감소:** `-1` (내가 입은 데미지량에 비례)
*   **KO 승리:** `+100` (상대 체력이 0이 되었을 때)
*   **KO 패배:** `-100` (내 체력이 0이 되었을 때)
*   **의미 없는 `idle` 반복:** `-0.01` (일정 시간 이상 `idle` 상태 유지 시 패널티, 행동 다양성 유도)
*   **상대와의 거리 좁히기:** `+0.1` (상대에게 접근할수록 보상)
*   **상대와의 거리 멀어지기:** `-0.1` (상대에게서 멀어질수록 패널티)
*   **공격 성공:** `+0.5` (공격이 상대에게 명중했을 때)
*   **공격 실패:** `-0.05` (공격이 빗나갔을 때 또는 가드되었을 때)

## 5. RL 알고리즘 선택 (RL Algorithm Selection)

격투 게임 환경은 연속적인 상태 공간과 이산적인 행동 공간을 가지며, 실시간 제어가 중요합니다. 이러한 특성을 고려하여 정책 기반(Policy-based) 알고리즘이 적합합니다.

*   **PPO (Proximal Policy Optimization):**
    *   **장점:** 안정적인 학습 성능과 비교적 구현이 용이하여 널리 사용됩니다. 정책 업데이트 시 이전 정책과의 큰 차이를 제한하여 학습 안정성을 높입니다.
*   **A2C/A3C (Advantage Actor-Critic / Asynchronous Advantage Actor-Critic):**
    *   **장점:** 병렬 환경에서 학습 속도가 빠르며, Actor-Critic 구조를 통해 정책과 가치 함수를 동시에 학습하여 효율적입니다.

**`Stable-Baselines3` 활용 예시:**

```python
from stable_baselines3 import PPO
# from stable_baselines3 import A2C # 또는 A2C

# FightingEnv 환경 인스턴스 생성
env = FightingEnv()

# PPO 모델 정의 및 학습
model = PPO("MlpPolicy", env, verbose=1) # MlpPolicy는 다층 퍼셉트론 정책을 의미
model.learn(total_timesteps=100000) # 총 10만 스텝 학습

# 학습된 모델을 이용한 플레이
obs = env.reset() # 환경 초기화
while True:
    action, _states = model.predict(obs) # 모델이 현재 상태(obs)에 기반하여 행동(action) 예측
    obs, rewards, done, info = env.step(action) # 행동을 환경에 적용하고 다음 상태, 보상 등 획득
    if done: # 에피소드가 종료되면
        break # 루프 종료
```

## 6. 실행 플로우 (Execution Flow)

RL 기반 AI 파이터 구현을 위한 전체적인 실행 플로우는 다음과 같습니다.

1.  **Python ↔ 게임 엔진 인터페이스 확정:** `get_game_state()` 및 `apply_ai_action()` 함수를 통해 Pygame 프로토타입(또는 향후 Ikemen GO)과 RL 환경 간의 데이터 교환 및 행동 제어 메커니즘을 최종 확정합니다.
2.  **`FightingEnv` 완성:** Gym API 표준에 맞춰 `FightingEnv` 클래스를 구현합니다. `reset()`, `step()` 메서드 내에서 게임 엔진과의 상호작용 로직을 완성합니다.
3.  **보상 함수 세분화:** 위에서 정의된 보상 함수 항목들을 게임의 실제 이벤트(데미지, KO, 거리 변화 등)와 연동하여 정교하게 구현합니다.
4.  **RL 알고리즘 적용:** `Stable-Baselines3` 라이브러리를 사용하여 PPO 또는 A2C 알고리즘을 `FightingEnv`에 적용하고 학습을 시작합니다.
5.  **학습된 모델 배포:** 학습이 완료된 RL 모델을 저장하고, 이를 `AIController`에 통합하여 실제 게임 플레이에 적용합니다. `AIController`는 더 이상 휴리스틱 대신 학습된 RL 모델의 `predict()` 메서드를 호출하여 행동을 결정합니다.

## 7. 결론 (Conclusion)

현재의 FSM 기반 AI는 단순한 반응만 가능하지만, 본 기획서에서 제시된 강화학습 기반의 접근 방식을 통해 AI는 게임 환경과 상호작용하며 스스로 최적의 격투 전략을 학습할 수 있게 됩니다. 이는 "AI가 격투를 배운다"라는 프로젝트의 핵심 콘셉트를 진정으로 구현하는 단계이며, 향후 Ikemen GO와의 연동을 통해 더욱 복잡하고 현실적인 AI 파이터를 개발하는 기반이 될 것입니다.
