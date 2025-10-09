# Phase 2 - 강화학습(RL) 정책 관리 및 교체 가능성 설계

이 문서는 Phase 2에서 개발될 강화학습 AI 파이터의 정책(Policy)을 유연하게 교체하고 관리할 수 있도록 하는 설계 방안을 제시합니다. 다양한 RL 알고리즘 실험, A/B 테스트, 그리고 동적인 AI 행동 구현을 위해 정책 교체 가능성은 필수적입니다.

## 1. 정책 교체 가능성의 필요성

*   **다양한 알고리즘 실험**: PPO, A2C, SAC 등 여러 강화학습 알고리즘의 성능을 비교하고 최적의 정책을 찾기 위함입니다.
*   **A/B 테스트**: 특정 정책 변경이 AI 성능에 미치는 영향을 정량적으로 평가하기 위함입니다.
*   **동적인 AI 행동**: 게임 내에서 AI의 난이도나 행동 패턴을 동적으로 변경하기 위함입니다.
*   **유지보수 및 확장성**: 새로운 정책을 쉽게 추가하거나 기존 정책을 수정할 수 있는 유연한 구조를 제공합니다.

## 2. 설계 원칙

*   **추상화된 인터페이스**: 모든 RL 정책은 공통된 인터페이스(예: `Policy` 인터페이스)를 구현해야 합니다. 이 인터페이스는 `predict`, `learn`, `save`, `load` 등의 메서드를 포함할 수 있습니다.
*   **설정 기반 로딩**: 어떤 정책을 사용할지는 설정 파일(예: `config.yaml`)을 통해 지정하며, 런타임에 해당 정책을 동적으로 로드할 수 있도록 합니다.
*   **모듈화**: 각 정책은 독립적인 모듈로 구현되어 다른 정책에 영향을 주지 않도록 합니다.
*   **버전 관리**: 학습된 정책 모델은 버전별로 관리되어야 하며, 특정 버전의 정책을 쉽게 불러와 사용할 수 있어야 합니다.

## 3. 구현 방안

### 3.1. Policy 인터페이스 정의 (Python 예시)

```python
from abc import ABC, abstractmethod

class RLPolicy(ABC):
    @abstractmethod
    def predict(self, observation: dict) -> dict:
        pass

    @abstractmethod
    def learn(self, total_timesteps: int):
        pass

    @abstractmethod
    def save(self, path: str):
        pass

    @abstractmethod
    def load(self, path: str):
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

# 예시 구현
class PPOPolicy(RLPolicy):
    def __init__(self, env, model_config):
        self._name = "PPO"
        # PPO 모델 초기화 로직

    def predict(self, observation: dict) -> dict:
        # PPO 모델의 예측 로직
        pass

    def learn(self, total_timesteps: int):
        # PPO 모델의 학습 로직
        pass

    def save(self, path: str):
        # PPO 모델 저장 로직
        pass

    def load(self, path: str):
        # PPO 모델 로드 로직
        pass

    @property
    def name(self) -> str:
        return self._name
```

### 3.2. Policy Factory 및 Manager

`PolicyFactory`는 설정에 따라 적절한 `RLPolicy` 객체를 생성하는 역할을 합니다. `PolicyManager`는 현재 활성화된 정책을 관리하고, 필요에 따라 정책을 교체하는 기능을 제공합니다.

```python
# policy_factory.py
from typing import Type

class PolicyFactory:
    _policies = {}

    @classmethod
    def register_policy(cls, name: str, policy_class: Type[RLPolicy]):
        cls._policies[name] = policy_class

    @classmethod
    def create_policy(cls, name: str, env, model_config) -> RLPolicy:
        policy_class = cls._policies.get(name)
        if not policy_class:
            raise ValueError(f"Policy {name} not registered.")
        return policy_class(env, model_config)

# policy_manager.py
class PolicyManager:
    def __init__(self, initial_policy_name: str, env, model_config):
        self._current_policy = PolicyFactory.create_policy(initial_policy_name, env, model_config)

    def switch_policy(self, new_policy_name: str, env, model_config):
        print(f"Switching policy from {self._current_policy.name} to {new_policy_name}")
        self._current_policy = PolicyFactory.create_policy(new_policy_name, env, model_config)

    def get_current_policy(self) -> RLPolicy:
        return self._current_policy

# 사용 예시
# PolicyFactory.register_policy("PPO", PPOPolicy)
# manager = PolicyManager("PPO", env, ppo_config)
# manager.get_current_policy().predict(observation)
```

### 3.3. 설정 파일 (`config.yaml`)

정책 선택 및 관련 하이퍼파라미터는 `config.yaml`을 통해 관리합니다.

```yaml
# config.yaml
rl_training:
  active_policy: PPO
  policies:
    PPO:
      algorithm: PPO
      hyperparameters:
        learning_rate: 0.0003
        batch_size: 256
        gamma: 0.99
    A2C:
      algorithm: A2C
      hyperparameters:
        learning_rate: 0.0007
        gamma: 0.99
```

## 4. 통합 및 CI/CD 연동

*   **CI/CD 파이프라인 업데이트**: `train_rl_agent.py` 스크립트가 `config.yaml`에서 `active_policy`를 읽어와 `PolicyManager`를 통해 해당 정책을 로드하도록 수정합니다.
*   **새 정책 추가**: 새로운 RL 알고리즘을 실험할 경우, `RLPolicy` 인터페이스를 구현하는 새 클래스를 추가하고 `PolicyFactory`에 등록한 후, `config.yaml`을 업데이트하여 쉽게 테스트할 수 있습니다.
*   **모델 아카이빙**: 각 정책별로 학습된 모델은 고유한 이름(예: `PPO_v1.zip`, `A2C_experiment_2.zip`)으로 아카이빙하여 버전 관리를 용이하게 합니다.

## 5. 현재 고려 중인 RL 정책 목록

*   **PPO (Proximal Policy Optimization)**: 안정적이고 좋은 성능을 보이는 Baseline 정책으로 우선 고려합니다.
*   **A2C (Advantage Actor-Critic)**: PPO와 비교하여 학습 속도 및 성능을 평가할 수 있는 대안 정책입니다.
*   **DQN (Deep Q-Network)**: 이산적인 행동 공간에 적합하며, 특정 상황에서의 성능을 테스트할 수 있습니다.
*   **Custom Rule-based Policy**: 특정 규칙에 따라 행동하는 정책을 구현하여, 학습된 AI의 성능과 비교하는 벤치마크로 활용합니다.
