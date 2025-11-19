from abc import ABC, abstractmethod
from typing import Type, Dict, Any

import gymnasium as gym
from stable_baselines3 import PPO, A2C # Import specific algorithms

class RLPolicy(ABC):
    @abstractmethod
    def predict(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def learn(self, total_timesteps: int, callback: Any = None):
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

class PPOPolicy(RLPolicy):
    def __init__(self, env: gym.Env, model_config: Dict[str, Any], seed: int = None):
        self._name = "PPO"
        self.model = PPO("MlpPolicy", env, seed=seed, **model_config)

    def predict(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        action, _ = self.model.predict(observation, deterministic=True)
        return action

    def learn(self, total_timesteps: int, callback: Any = None):
        self.model.learn(total_timesteps=total_timesteps, callback=callback)

    def save(self, path: str):
        self.model.save(path)

    def load(self, path: str):
        self.model = PPO.load(path)

    @property
    def name(self) -> str:
        return self._name

class A2CPolicy(RLPolicy):
    def __init__(self, env: gym.Env, model_config: Dict[str, Any], seed: int = None):
        self._name = "A2C"
        self.model = A2C("MlpPolicy", env, seed=seed, **model_config)

    def predict(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        action, _ = self.model.predict(observation, deterministic=True)
        return action

    def learn(self, total_timesteps: int, callback: Any = None):
        self.model.learn(total_timesteps=total_timesteps, callback=callback)

    def save(self, path: str):
        self.model.save(path)

    def load(self, path: str):
        self.model = A2C.load(path)

    @property
    def name(self) -> str:
        return self._name

class PolicyFactory:
    _policies: Dict[str, Type[RLPolicy]] = {}

    @classmethod
    def register_policy(cls, name: str, policy_class: Type[RLPolicy]):
        cls._policies[name] = policy_class

    @classmethod
    def create_policy(cls, name: str, env: gym.Env, model_config: Dict[str, Any], seed: int = None) -> RLPolicy:
        policy_class = cls._policies.get(name)
        if not policy_class:
            raise ValueError(f"Policy {name} not registered.")
        return policy_class(env, model_config, seed)

# Register available policies
PolicyFactory.register_policy("PPO", PPOPolicy)
PolicyFactory.register_policy("A2C", A2CPolicy)

class PolicyManager:
    def __init__(self, initial_policy_name: str, env: gym.Env, model_config: Dict[str, Any], seed: int = None):
        self._current_policy = PolicyFactory.create_policy(initial_policy_name, env, model_config, seed)

    def switch_policy(self, new_policy_name: str, env: gym.Env, model_config: Dict[str, Any], seed: int = None):
        print(f"Switching policy from {self._current_policy.name} to {new_policy_name}")
        self._current_policy = PolicyFactory.create_policy(new_policy_name, env, model_config, seed)

    def get_current_policy(self) -> RLPolicy:
        return self._current_policy
