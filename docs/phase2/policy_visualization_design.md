# Phase 2: RL Policy Visualization Design Document

## 1. Goal
The primary goal of the Phase 2 demonstration web page is to clearly and effectively visualize the behavior and performance of the trained Reinforcement Learning (RL) policies. This includes both numerical metrics and an in-game representation of the policy's actions and decision-making process.

## 2. Data to be Shown

### 2.1. Numerical Metrics (RL Dashboard Page)
The RL Dashboard Page (`RLDashboardPage.tsx`) will display the following key performance indicators (KPIs) of the RL agent's training and performance:
*   **Reward Over Episodes:** A line chart showing the average reward obtained by the agent over a series of training or evaluation episodes.
*   **Win Rate Over Episodes:** A line chart illustrating the percentage of wins against an opponent (e.g., another AI or a rule-based agent) over time.
*   **Episode Length Over Episodes:** A line chart showing the average duration (in timesteps or frames) of episodes.
*   **Action Distribution:** A bar chart or pie chart showing the frequency of different actions taken by the policy (e.g., punch, kick, block, jump, move left/right, special). This could be aggregated over an episode or a set of episodes.
*   **Policy Loss / Value Loss (Optional):** If relevant for debugging and deeper analysis, these training-specific metrics could also be displayed.

### 2.2. In-Game Visualization (RL Demo Page)
The RL Demo Page (`RLDemoPage.tsx`) will provide a visual representation of the policy's behavior within the game environment. This will include:
*   **Player Positions & Health:** Real-time display of both player characters' positions and health bars.
*   **Current Actions:** Visual indicators (e.g., text overlay, animation highlights) showing the action currently being executed by the RL agent.
*   **Hitbox Visualization (Optional):** Overlaying hitboxes and hurtboxes to illustrate collision detection.
*   **Observation Space (Optional):** A debug view showing the raw numerical observation array being fed to the RL agent.

## 3. Visualization Methods

### 3.1. RL Dashboard Page
*   **Charting Library:** Integration with a modern charting library (e.g., Chart.js, Recharts, Nivo) to render interactive line and bar charts for numerical metrics.
*   **Data Source:** Metrics will be fetched from a backend API endpoint that processes and aggregates training logs or real-time evaluation data.

### 3.2. RL Demo Page
*   **Game Rendering Component:** A dedicated React component that can render the game state based on data received from the backend. This component will need to interpret game state updates (player positions, animations, health) and render them visually.
*   **Real-time Data Stream:** The game state and agent actions will be streamed from the backend (likely via WebRTC or WebSockets) to the frontend for live visualization.

## 4. Policy Behavior Demonstration

The visualization will aim to demonstrate:
*   **Responsiveness:** How quickly and appropriately the policy reacts to changes in the game state (e.g., opponent's attack, health changes).
*   **Strategic Play:** Observing patterns in action sequences (combos, defensive maneuvers) that indicate learned strategies.
*   **Decision-Making:** For numerical visualization, the action distribution can show the policy's preference for certain actions under different conditions.

## 5. Wireframes (Conceptual)

### 5.1. RL Dashboard Page
*   **Layout:** A grid-based layout with multiple chart components.
*   **Controls:** A dropdown for selecting different trained policies, a date/time range picker for historical data, and a "Refresh" button.
*   **Chart Types:** Line charts for time-series data (rewards, win rates, episode lengths), bar/pie charts for action distribution.

### 5.2. RL Demo Page
*   **Layout:** A central game simulation area, with side panels or overlays for:
    *   Model selection dropdown.
    *   "Start/Stop Simulation" button.
    *   Real-time display of player health, score, current action.
    *   (Optional) Debug panel showing current observation vector.

## 6. System Flow

1.  **RL Agent Training (Backend):** The `train_rl_agent.py` script trains RL policies, saving models and generating training logs (which contain episode metrics).
2.  **Simulation Manager (Backend):** For in-game visualization, a simulation manager (e.g., `src/simulation/simulation_manager.py`) will load a trained policy and run game simulations.
3.  **Data Collection (Backend):** During training and simulation, relevant data (game states, actions, rewards) is collected and stored (e.g., in logs, database).
4.  **Backend API:** A FastAPI backend will expose API endpoints:
    *   To serve trained policy models to the simulation manager.
    *   To provide historical training metrics for the dashboard.
    *   To establish real-time communication (WebRTC/WebSockets) for live game state streaming to the demo page.
5.  **Frontend (React Application):**
    *   `RLDashboardPage.tsx`: Fetches historical metrics from the backend API and renders them using a charting library.
    *   `RLDemoPage.tsx`: Establishes a real-time connection with the backend simulation manager, receives game state updates, and renders the game visually. It also sends agent actions (if interactive demo) or receives policy-generated actions.

## 7. Implementation Considerations

*   **Backend API Endpoints:** Need to define specific API endpoints for fetching metrics and streaming game data.
*   **Frontend Components:** Develop actual charting components and a game rendering component.
*   **Data Serialization:** Ensure efficient serialization/deserialization of game states and actions between backend and frontend.
*   **Performance:** Optimize real-time data streaming and frontend rendering for smooth visualization.
*   **Error Handling:** Implement robust error handling for network issues and data inconsistencies.
