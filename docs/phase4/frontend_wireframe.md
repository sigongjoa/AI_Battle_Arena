# Frontend Wireframe: Game Screen

This document describes the wireframe and component structure of the main game screen, based on the current frontend code.

## 1. High-Level Structure

The main game screen is composed of the following components:

*   **`GameScreen.tsx`**: The top-level container for the game screen.
*   **`HUD.tsx`**: The Heads-Up Display, which contains all the UI elements like health bars, timer, etc.
*   **`Character.tsx`**: The component that renders the player characters.
*   **`PauseMenu.tsx`**: The menu that appears when the game is paused.
*   **`GameInputProvider.tsx`**: A component that wraps the game screen and handles user input.

## 2. Component Breakdown

### 2.1. `GameScreen.tsx`

*   **Purpose**: To layout the main game screen, including the `HUD` and the `PauseMenu`.
*   **Structure**:
    *   A main container `div` with class `game-screen`.
    *   Renders the `HUD` component.
    *   Conditionally renders the `PauseMenu` component when the game is paused.

### 2.2. `HUD.tsx`

*   **Purpose**: To display all the real-time information to the players.
*   **Structure**:
    *   A main container `div` with a background image.
    *   An overlay `div` for a darkening effect.
    *   A section for rendering the `Character` components.
    *   **Top HUD**:
        *   **Player 1 Info**:
            *   Player 1 name.
            *   Player 1 health bar.
        *   **Timer**: A centrally located timer.
        *   **Player 2 Info**:
            *   Player 2 name.
            *   Player 2 health bar.
    *   **Bottom HUD**:
        *   **Player 1 Super Gauge**: A bar to indicate the super meter.
        *   **Player 2 Super Gauge**: A bar to indicate the super meter.

### 2.3. `Character.tsx`

*   **Purpose**: To render a single player character as a sprite.
*   **Functionality**:
    *   Uses `characterMetadata.json` to get the sprite sheet and animation data for the character.
    *   Displays a specific frame from the sprite sheet based on the character's current `action` and `frame`.
    *   Flips the sprite horizontally based on the `direction` the character is facing.

### 2.4. `PauseMenu.tsx`

*   **Purpose**: To provide a pause menu with options to resume, restart, or quit.
*   **Structure**:
    *   A full-screen overlay with a blurred background.
    *   A title "ANALYSIS MODE".
    *   Three buttons: "Resume", "Restart Match", and "Quit to Main Menu".

### 2.5. `GameInputProvider.tsx`

*   **Purpose**: To capture keyboard input for player actions.
*   **Functionality**:
    *   Listens for `keydown` events.
    *   Maps arrow keys and spacebar to player actions (LEFT, RIGHT, PUNCH).
    *   Sends the actions to the backend via the `webRtcClient`.

## 3. Visual Layout

```
+--------------------------------------------------------------------------+
| [Player 1 Name]                            [Timer]                            [Player 2 Name] |
| [================ Health Bar ================] [ 99  ] [================ Health Bar ================] |
|                                                                          |
|                                                                          |
|                                                                          |
|                                                                          |
|                                                                          |
|                    <Character />         <Character />                     |
|                                                                          |
|                                                                          |
|                                                                          |
|                                                                          |
| [--- Super Gauge ---]                                     [--- Super Gauge ---] |
+--------------------------------------------------------------------------+
```

*   When paused, the `PauseMenu` appears as an overlay on top of this screen.
