import gymnasium as gym
from gymnasium import spaces
import numpy as np

class FlattenActionSpaceWrapper(gym.ActionWrapper):
    """
    A wrapper that flattens a Tuple(Discrete, Discrete) action space into a MultiDiscrete action space.
    This is useful for algorithms that do not directly support Tuple action spaces.
    """
    def __init__(self, env):
        super().__init__(env)
        assert isinstance(env.action_space, spaces.Tuple) and all(isinstance(s, spaces.Discrete) for s in env.action_space.spaces), \
            "Expected a Tuple of Discrete spaces for this wrapper."
        
        # The new action space will be MultiDiscrete with nvec = [n_discrete_1, n_discrete_2]
        self.action_space = spaces.MultiDiscrete([s.n for s in env.action_space.spaces])

    def action(self, action):
        """
        Converts the MultiDiscrete action back to the original Tuple(Discrete, Discrete) action.
        """
        # Assuming action is a numpy array from MultiDiscrete
        return tuple(action.tolist())

    def reverse_action(self, action):
        """
        Converts the original Tuple(Discrete, Discrete) action to MultiDiscrete.
        This method is typically not used by the agent, but can be useful for debugging.
        """
        return np.array(action)
