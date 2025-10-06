from stable_baselines3.common.callbacks import BaseCallback
from stable_baselines3.common.results_plotter import load_results, ts2xy
import numpy as np
import os


class CustomTensorboardCallback(BaseCallback):
    """
    A custom callback for logging additional metrics to TensorBoard.
    """

    def __init__(self, verbose: int = 0):
        super().__init__(verbose)
        # self.episode_rewards = [] # Not needed if logging directly from info
        # self.episode_wins = []
        # self.episode_lengths = []

    def _on_training_start(self) -> None:
        # Log hyperparameters and other config at the start of training
        hparam_dict = {
            "algorithm": self.model.__class__.__name__,
            "learning_rate": self.model.learning_rate,
            "gamma": self.model.gamma,
            "n_steps": self.model.n_steps,
            "gae_lambda": self.model.gae_lambda,
            "clip_range": self.model.clip_range,
            "ent_coef": self.model.ent_coef,
            "vf_coef": self.model.vf_coef,
        }
        # Define metric for the hyperparameter (tensorboard only) - not needed for custom metrics
        # metric_dict = {"rollout/ep_len_mean": 0, "train/value_loss": 0}
        # self.logger.record("hparams", HParam(hparam_dict, metric_dict))
        pass

    def _on_step(self) -> bool:
        # This method is called after each call to `env.step()`
        # We need to check if an episode has ended to log episode-specific metrics
        # Stable-Baselines3 wraps the environment, and when an episode ends, the info dict
        # contains an 'episode' key with 'r' (reward) and 'l' (length).
        if self.locals["dones"][0]:  # Assuming single environment for now
            # Retrieve episode info from the info dictionary
            info = self.locals["infos"][0]

            if "episode" in info.keys():
                episode_reward = info["episode"]["r"]
                episode_length = info["episode"]["l"]
                player_won = info.get(
                    "player_won", False
                )  # Custom info from FightingEnv

                # Log to TensorBoard
                self.logger.record("custom/episode_reward", episode_reward)
                self.logger.record("custom/episode_length", episode_length)
                self.logger.record("custom/player_won", 1 if player_won else 0)

        return True
