// arcade-clash/src/shared_game_logic/input_data.ts

/**
 * @interface PlayerInput
 * @description Represents the input for a player at a specific game frame.
 */
export interface PlayerInput {
    frame: number;
    playerId: string;
    inputs: {
        left: boolean;
        right: boolean;
        jump: boolean;
        attack: boolean;
        guard: boolean;
        // Add other basic inputs as needed for the PoC
    };
    isPrediction?: boolean; // Flag to mark if the input is a prediction
}
