# src/qa_evaluator/ai_personas.py

class AIPersona:
    def __init__(self, name, description, reward_weights, training_params, error_tolerance=0.0,
                 action_masking_rules=None, custom_reward_function_config=None):
        self.name = name
        self.description = description
        self.reward_weights = reward_weights
        self.training_params = training_params
        self.error_tolerance = error_tolerance
        self.action_masking_rules = action_masking_rules if action_masking_rules is not None else {}
        self.custom_reward_function_config = custom_reward_function_config if custom_reward_function_config is not None else {}

# Define different AI Personas
PERSONAS = {
    "Beginner AI": AIPersona(
        name="Beginner AI",
        description="Focuses on basic movement and occasional attacks, with high error tolerance.",
        reward_weights={'damage': 0.5, 'survival': 1.0, 'explore': 0.2, 'combo_success': 0.1}, # Lower combo success reward
        training_params={'learning_rate': 0.0005, 'n_steps': 1024, 'gamma': 0.9},
        error_tolerance=0.3, # Simulates frequent mistakes
        action_masking_rules={'complex_moves': True, 'special_attacks': True}, # Mask complex moves
        custom_reward_function_config={}
    ),
    "Pro-gamer AI": AIPersona(
        name="Pro-gamer AI",
        description="Optimizes for winning, high damage output, and minimal errors.",
        reward_weights={'damage': 2.0, 'survival': 1.5, 'win': 5.0, 'explore': 0.01, 'combo_success': 1.5, 'FunScore': 0.5}, # Added FunScore
        training_params={'learning_rate': 0.0001, 'n_steps': 4096, 'gamma': 0.99},
        error_tolerance=0.0, # Simulates very few mistakes
        action_masking_rules={},
        custom_reward_function_config={}
    ),
    "Pressure AI": AIPersona(
        name="Pressure AI",
        description="Aggressively closes distance and maintains offensive pressure.",
        reward_weights={'damage': 1.2, 'distance_to_opponent': -1.0, 'attack_frequency': 0.8, 'survival': 0.8, 'combo_success': 1.0},
        training_params={'learning_rate': 0.0002, 'n_steps': 2048, 'gamma': 0.95},
        error_tolerance=0.1,
        action_masking_rules={},
        custom_reward_function_config={}
    ),
    "Troll AI": AIPersona(
        name="Troll AI",
        description="Aims to annoy the opponent, avoid direct confrontation, or exploit game mechanics.",
        reward_weights={'opponent_frustration': 1.0, 'distance_to_opponent': 0.5, 'damage': -0.1, 'survival': 0.5, 'repeated_defense_induce': 1.0}, # Placeholder for frustration
        training_params={'learning_rate': 0.0003, 'n_steps': 1024, 'gamma': 0.9},
        error_tolerance=0.05, # Low error to perform intentional trolling
        action_masking_rules={},
        custom_reward_function_config={'non_winning_objective': True} # Flag for custom reward logic
    )
}

if __name__ == '__main__':
    print("Defined AI Personas:")
    for name, persona in PERSONAS.items():
        print(f"- {persona.name}: {persona.description}")
        print(f"  Reward Weights: {persona.reward_weights}")
        print(f"  Training Params: {persona.training_params}")
        print(f"  Error Tolerance: {persona.error_tolerance}")
        print(f"  Action Masking Rules: {persona.action_masking_rules}")
        print(f"  Custom Reward Config: {persona.custom_reward_function_config}")
