# src/qa_evaluator/ai_personas.py

class AIPersona:
    def __init__(self, name, description, reward_weights, training_params, error_tolerance=0.0):
        self.name = name
        self.description = description
        self.reward_weights = reward_weights # Dict: e.g., {'damage': 1.0, 'distance_to_opponent': -0.5}
        self.training_params = training_params # Dict: e.g., {'learning_rate': 0.0001, 'n_steps': 2048}
        self.error_tolerance = error_tolerance # How much human error this persona can tolerate/simulate

# Define different AI Personas
PERSONAS = {
    "Beginner AI": AIPersona(
        name="Beginner AI",
        description="Focuses on basic movement and occasional attacks, with high error tolerance.",
        reward_weights={'damage': 0.5, 'survival': 1.0, 'explore': 0.2},
        training_params={'learning_rate': 0.0005, 'n_steps': 1024, 'gamma': 0.9},
        error_tolerance=0.3 # Simulates frequent mistakes
    ),
    "Pro-gamer AI": AIPersona(
        name="Pro-gamer AI",
        description="Optimizes for winning, high damage output, and minimal errors.",
        reward_weights={'damage': 2.0, 'survival': 1.5, 'win': 5.0, 'explore': 0.01},
        training_params={'learning_rate': 0.0001, 'n_steps': 4096, 'gamma': 0.99},
        error_tolerance=0.01 # Simulates very few mistakes
    ),
    "Pressure AI": AIPersona(
        name="Pressure AI",
        description="Aggressively closes distance and maintains offensive pressure.",
        reward_weights={'damage': 1.2, 'distance_to_opponent': -1.0, 'attack_frequency': 0.8, 'survival': 0.8},
        training_params={'learning_rate': 0.0002, 'n_steps': 2048, 'gamma': 0.95},
        error_tolerance=0.1
    ),
    "Troll AI": AIPersona(
        name="Troll AI",
        description="Aims to annoy the opponent, avoid direct confrontation, or exploit game mechanics.",
        reward_weights={'opponent_frustration': 1.0, 'distance_to_opponent': 0.5, 'damage': -0.1, 'survival': 0.5}, # Placeholder for frustration
        training_params={'learning_rate': 0.0003, 'n_steps': 1024, 'gamma': 0.9},
        error_tolerance=0.2
    )
}

if __name__ == '__main__':
    print("Defined AI Personas:")
    for name, persona in PERSONAS.items():
        print(f"- {persona.name}: {persona.description}")
        print(f"  Reward Weights: {persona.reward_weights}")
        print(f"  Training Params: {persona.training_params}")
        print(f"  Error Tolerance: {persona.error_tolerance}")
