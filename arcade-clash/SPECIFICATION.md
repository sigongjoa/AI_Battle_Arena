# Arcade Clash: Application Specification

This document provides a detailed specification for each screen of the Arcade Clash application and outlines a strategy for dynamic data injection.

## 1. Page Specifications

This section defines the purpose, functionality, and data requirements for each page within the application.

### MainMenu (`Screen.MainMenu`)

*   **Purpose:** To serve as the entry point of the application, providing users with primary navigation options.
*   **Functionality:**
    *   Displays the game title.
    *   Provides buttons to navigate to different sections of the app:
        *   `Start Game` -> `CharacterSelect`
        *   `Move List` -> `MoveList`
        *   `Matchup Analysis` -> `MatchupAnalysis`
        *   `Analysis Mode` -> `AnalysisMode`
        *   `Training Mode` -> `TrainingMode`
*   **Data Dependencies:** None.

### CharacterSelect (`Screen.CharacterSelect`)

*   **Purpose:** To allow users to select their fighters for a match.
*   **Functionality:**
    *   Displays a grid of all available characters.
    *   Prompts the user to select Player 1, then Player 2.
    *   Highlights the selected character for Player 1.
    *   Once two characters are selected, it transitions to the `VSScreen`.
    *   Allows navigation back to the `MainMenu`.
*   **Data Dependencies:** A list of `Character` objects from `constants.ts`.

### VSScreen (`Screen.VSScreen`)

*   **Purpose:** To build anticipation before a match starts by displaying the selected fighters in a classic "versus" style.
*   **Functionality:**
    *   Displays large portraits of the two selected characters.
    *   Shows Player 1 and Player 2 designations.
    *   Automatically transitions to the `HUD` screen after a short delay (4 seconds).
*   **Data Dependencies:** The two `Character` objects selected in the `CharacterSelect` screen.

### HUD (`Screen.HUD`)

*   **Purpose:** To display the main gameplay interface for a match in progress.
*   **Functionality:**
    *   Simulates a live fight.
    *   Displays health bars and super meter bars for both players.
    *   Shows a round timer.
    *   The simulation logic randomly decreases health and increases super meters.
    *   A win condition is checked based on health or the timer reaching zero.
    *   Transitions to `MatchResults` when a winner is determined.
    *   Allows the user to pause the game by pressing 'Escape', which opens a `PauseMenu`.
*   **Data Dependencies:** The two `Character` objects selected for the match.

### MatchResults (`Screen.MatchResults`)

*   **Purpose:** To display the outcome of the match.
*   **Functionality:**
    *   Announces the winner or if the match was a draw.
    *   Shows the profile images and names of the winner and loser.
    *   Provides options to:
        *   `Rematch` (navigates to `VSScreen` with the same characters).
        *   `Character Select` (navigates back to `CharacterSelect`).
        *   `Exit to Main Menu` (navigates to `MainMenu`).
*   **Data Dependencies:** The `winner` and `loser` `Character` objects from the completed match.

### MoveList (`Screen.MoveList`)

*   **Purpose:** To provide a detailed breakdown of a character's special moves and abilities.
*   **Functionality:**
    *   Displays a list of moves for a default character (Ryu).
    *   Users can click on a move from the list on the right.
    *   The main panel displays detailed information for the selected move, including its description, input command, and frame data.
    *   Includes a placeholder video player for demonstrating the move.
*   **Data Dependencies:** A `Character` object and a corresponding list of `Move` objects (currently hardcoded for Ryu in `constants.ts`).

### MatchupAnalysis (`Screen.MatchupAnalysis`)

*   **Purpose:** To offer a strategic analysis of how two characters fare against each other.
*   **Functionality:**
    *   Displays a side-by-side textual analysis for two default characters (Ryu vs. Ken).
    *   Provides example strategies, such as opening moves and countering aggression.
    *   Features a central graphic with the two characters facing off.
*   **Data Dependencies:** Two `Character` objects (currently defaults to Player 1 and Player 2). The analysis text is currently static.

### AnalysisMode (`Screen.AnalysisMode`)

*   **Purpose:** To provide a deep-dive visual and technical analysis of specific character moves.
*   **Functionality:**
    *   Displays a large character model in the center.
    *   Shows detailed breakdowns of two key moves in panels on either side.
    *   Each panel includes input commands, descriptions, and frame data.
    *   Allows the user to return to the main menu.
*   **Data Dependencies:** A `Character` object (defaults to Player 1). The move data is currently static.

### TrainingMode (`Screen.TrainingMode`)

*   **Purpose:** To visualize the progress of AI agents being trained to play the characters, using reinforcement learning metrics.
*   **Functionality:**
    *   Displays a background scene representing a training environment.
    *   Features two panels, one for each character, showing key RL metrics: Loss, Reward, Q-Value, and Episode Length.
    *   Shows the percentage change for each metric to indicate training progress.
    *   Includes a central "play" button to start or pause the training simulation.
*   **Data Dependencies:** Two `Character` objects. The metric values are currently static.

---

## 2. Automatic Data Injection

The application currently uses hardcoded data stored in `constants.ts`. To make it dynamic and scalable, data should be fetched from an external source.

### General Strategy: API/JSON Loading

Instead of importing from `constants.ts`, data can be loaded from a public JSON file or a dedicated API endpoint when the application starts.

**Example: Loading Character Data in `App.tsx`**

```typescript
// In App.tsx

import React, { useState, useEffect, useCallback } from 'react';
// ... other imports

const App: React.FC = () => {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch data from an API or a static JSON file
        fetch('/api/characters.json')
            .then(res => res.json())
            .then(data => {
                setCharacters(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error("Failed to load character data:", error);
                setIsLoading(false);
            });
    }, []);

    // ... rest of the component
    // Pass the `characters` state to components that need it, like CharacterSelect.
    // Handle the `isLoading` state by showing a loading spinner.
};
```

This approach can be applied to load character lists, move lists, etc.

### Page-Specific Data Injection

#### MatchupAnalysis: Dynamic AI-Powered Analysis

The static analysis text can be replaced with dynamically generated content from the Gemini API. When the user enters this screen, an API call can be made to get a fresh analysis.

**Conceptual Implementation:**

```typescript
// In components/MatchupAnalysis.tsx
import { GoogleGenAI } from "@google/genai";

// ...

const MatchupAnalysis: React.FC<MatchupAnalysisProps> = ({ player1, player2, onNavigate }) => {
    const [analysis, setAnalysis] = useState({ p1: 'Loading...', p2: 'Loading...' });

    useEffect(() => {
        const generateAnalysis = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Provide a brief fighting game matchup analysis for ${player1.name} versus ${player2.name}. Focus on ${player1.name}'s opening moves and how they might counter ${player2.name}'s aggression. Then, do the same for ${player2.name}.`;
                
                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: prompt,
                });
                
                const generatedText = response.text;
                // Here you would parse the generatedText to populate the analysis state
                // For example, split the text into two parts for p1 and p2.
                // setAnalysis({ p1: '...', p2: '...' });
            } catch (error) {
                console.error("Error generating matchup analysis:", error);
                setAnalysis({ p1: 'Failed to load analysis.', p2: 'Failed to load analysis.' });
            }
        };

        generateAnalysis();
    }, [player1, player2]);

    // ... render the `analysis.p1` and `analysis.p2` in the UI
}
```

#### TrainingMode: Real-time Metric Updates

The reinforcement learning metrics in `TrainingMode` should be updated in real-time to be useful. This is a perfect use case for WebSockets.

**Conceptual Implementation:**

1.  **Backend:** A backend server would run the training simulation and push metric updates through a WebSocket connection.
2.  **Frontend (`TrainingMode.tsx`):** The component would establish a WebSocket connection and update its state whenever a new message (with updated metrics) is received.

```typescript
// In components/TrainingMode.tsx
useEffect(() => {
    const socket = new WebSocket('ws://your-training-backend.com/metrics');

    socket.onopen = () => {
        console.log('Connected to training server.');
        // Request metrics for player1.id and player2.id
        socket.send(JSON.stringify({ subscribe: [player1.id, player2.id] }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Assuming data is like { characterId: 1, metrics: { loss: 0.017, ... } }
        if (data.characterId === player1.id) {
            // update player 1 metrics state
        } else if (data.characterId === player2.id) {
            // update player 2 metrics state
        }
    };

    socket.onclose = () => {
        console.log('Disconnected from training server.');
    };

    // Clean up the connection when the component unmounts
    return () => {
        socket.close();
    };
}, [player1, player2]);
```

This approach would provide a live, dynamic dashboard of the AI training process.
