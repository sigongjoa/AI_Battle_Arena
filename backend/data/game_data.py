# backend/data/game_data.py

# Placeholder for actual game data.
# In a real application, this would likely come from a database or more complex configuration.

CHARACTERS_DATA = {
    1: {
        "id": 1,
        "name": "Ryu",
        "description": "A wandering martial artist, always seeking to improve his skills.",
        "image": "/assets/ryu_full.png",
        "profileImage": "/assets/ryu_profile.png",
        "vsImage": "/assets/ryu_vs.png",
        "color": "emphasis-yellow",
        "moves": [
            {"name": "Hadoken", "description": "A powerful energy blast.", "input": "↓↘→ + P", "frameData": "Startup: 10f, Active: 5f, Recovery: 15f"},
            {"name": "Shoryuken", "description": "A leaping uppercut.", "input": "→↓↘ + P", "frameData": "Startup: 3f, Active: 8f, Recovery: 20f"},
            {"name": "Tatsumaki Senpukyaku", "description": "A spinning kick.", "input": "↓↙← + K", "frameData": "Startup: 8f, Active: 10f, Recovery: 12f"},
        ]
    },
    2: {
        "id": 2,
        "name": "Ken",
        "description": "Ryu's best friend and rival, known for his fiery techniques.",
        "image": "/assets/ken_full.png",
        "profileImage": "/assets/ken_profile.png",
        "vsImage": "/assets/ken_vs.png",
        "color": "emphasis-red",
        "moves": [
            {"name": "Hadoken", "description": "A powerful energy blast.", "input": "↓↘→ + P", "frameData": "Startup: 10f, Active: 5f, Recovery: 15f"},
            {"name": "Shoryuken", "description": "A leaping uppercut.", "input": "→↓↘ + P", "frameData": "Startup: 3f, Active: 8f, Recovery: 20f"},
            {"name": "Tatsumaki Senpukyaku", "description": "A spinning kick.", "input": "↓↙← + K", "frameData": "Startup: 8f, Active: 10f, Recovery: 12f"},
        ]
    },
    3: {
        "id": 3,
        "name": "Chun-Li",
        "description": "An Interpol officer seeking justice.",
        "image": "/assets/chunli_full.png",
        "profileImage": "/assets/chunli_profile.png",
        "vsImage": "/assets/chunli_vs.png",
        "color": "emphasis-blue",
        "moves": [
            {"name": "Kikoken", "description": "A projectile attack.", "input": "←↙↓↘→ + P", "frameData": "Startup: 12f, Active: 6f, Recovery: 18f"},
            {"name": "Spinning Bird Kick", "description": "A powerful aerial kick.", "input": "↓↙← + K", "frameData": "Startup: 7f, Active: 12f, Recovery: 10f"},
        ]
    }
}

# Extract moves data for separate access
MOVES_DATA = {
    char_id: char_data["moves"] for char_id, char_data in CHARACTERS_DATA.items()
}

# Remove moves from CHARACTERS_DATA for the /characters endpoint
# as the DTO for CharacterDTO does not include moves directly
# (moves are fetched via a separate endpoint)
CHARACTERS_FOR_API = {
    char_id: {k: v for k, v in char_data.items() if k != "moves"}
    for char_id, char_data in CHARACTERS_DATA.items()
}
