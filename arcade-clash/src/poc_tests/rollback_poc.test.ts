// arcade-clash/src/poc_tests/rollback_poc.test.ts

import { GameEngine, GameState, FixedPoint, PlayerInput } from '../shared_game_logic';

describe('Rollback Loop Proof-of-Concept', () => {
    const PLAYER_ID_1 = 'player1';
    const PLAYER_ID_2 = 'player2';
    const FIXED_DELTA_TIME = FixedPoint.fromFloat(1 / 60); // 60 FPS
    const ROLLBACK_WINDOW_FRAMES = 8; // Max frames to rollback (e.g., for 120ms latency)
    const FRAME_TIME_BUDGET_MS = 16.67; // 1000ms / 60fps

    // Helper to create initial game state
    const createInitialGameState = (seed: number): GameState => ({
        frame: 0,
        player1: {
            id: PLAYER_ID_1,
            position: { x: FixedPoint.fromFloat(-10), y: FixedPoint.fromFloat(0) },
            velocity: { x: FixedPoint.fromFloat(0), y: FixedPoint.fromFloat(0) },
            health: FixedPoint.fromFloat(100),
            isGrounded: true,
        },
        player2: {
            id: PLAYER_ID_2,
            position: { x: FixedPoint.fromFloat(10), y: FixedPoint.fromFloat(0) },
            velocity: { x: FixedPoint.fromFloat(0), y: FixedPoint.fromFloat(0) },
            health: FixedPoint.fromFloat(100),
            isGrounded: true,
        },
        randomSeed: seed,
    });

    // Helper to generate a sequence of inputs
    const generateInputSequence = (numFrames: number): { [frame: number]: { [playerId: string]: PlayerInput } } => {
        const inputs: { [frame: number]: { [playerId: string]: PlayerInput } } = {};
        for (let i = 0; i < numFrames; i++) {
            inputs[i] = {
                [PLAYER_ID_1]: {
                    frame: i,
                    playerId: PLAYER_ID_1,
                    inputs: {
                        left: i % 10 === 0, // Press left every 10 frames
                        right: false,
                        jump: false,
                        attack: false,
                    },
                },
                [PLAYER_ID_2]: {
                    frame: i,
                    playerId: PLAYER_ID_2,
                    inputs: {
                        left: false,
                        right: i % 15 === 0, // Press right every 15 frames
                        jump: false,
                        attack: false,
                    },
                },
            };
        }
        return inputs;
    };

    it('should perform rollback and re-simulate within performance budget', () => {
        const NUM_SIMULATION_FRAMES = 200; // Simulate 200 frames
        const INITIAL_RANDOM_SEED = 12345;

        const engine = new GameEngine(createInitialGameState(INITIAL_RANDOM_SEED), FIXED_DELTA_TIME);
        const inputSequence = generateInputSequence(NUM_SIMULATION_FRAMES);

        // Simulate normally for a few frames, saving state
        for (let frame = 0; frame < ROLLBACK_WINDOW_FRAMES + 5; frame++) {
            engine.simulateFrame(inputSequence[frame]);
            engine.saveState(engine.getGameState().frame); // Save state after simulation
        }

        // --- Simulate a rollback scenario ---
        // Assume we are at frame X, but just received a corrected input for frame X - ROLLBACK_WINDOW_FRAMES
        const currentFrame = engine.getGameState().frame; // Let's say this is frame 13
        const rollbackToFrame = currentFrame - ROLLBACK_WINDOW_FRAMES; // Rollback to frame 5

        // Simulate receiving a corrected input for an earlier frame
        // For this PoC, we'll just pretend an input for rollbackToFrame was corrected.
        // In a real scenario, this would come from the network.
        const correctedInputForRollbackFrame = {
            ...inputSequence[rollbackToFrame],
            [PLAYER_ID_1]: {
                ...inputSequence[rollbackToFrame][PLAYER_ID_1],
                inputs: { ...inputSequence[rollbackToFrame][PLAYER_ID_1].inputs, jump: true }, // Player 1 unexpectedly jumped!
            },
        };

        // Start performance measurement
        const startTime = performance.now();

        // 1. Load the state from the rollback point
        expect(engine.loadState(rollbackToFrame)).toBe(true); // Ensure state can be loaded

        // 2. Re-simulate from the rollback point up to the current frame with corrected inputs
        for (let frame = rollbackToFrame; frame < currentFrame; frame++) {
            let inputsForThisFrame = inputSequence[frame];
            if (frame === rollbackToFrame) {
                inputsForThisFrame = correctedInputForRollbackFrame; // Use corrected input for the rollback frame
            }
            engine.simulateFrame(inputsForThisFrame);
            engine.saveState(engine.getGameState().frame); // Save re-simulated state
        }

        const endTime = performance.now();
        const reSimulationDuration = endTime - startTime;

        console.log(`Rollback re-simulation duration: ${reSimulationDuration.toFixed(2)} ms`);

        // Assert that re-simulation completed within the performance budget
        expect(reSimulationDuration).toBeLessThan(FRAME_TIME_BUDGET_MS);

        // Assert that the final state is consistent (optional, but good for sanity check)
        // In a real rollback, you'd compare this final state with what the other client has.
        const finalChecksum = engine.calculateChecksum();
        expect(finalChecksum).toBeDefined();

        // Clean up old states (optional for PoC, but good practice)
        engine.cleanStateHistory(currentFrame - ROLLBACK_WINDOW_FRAMES);
    });
});
