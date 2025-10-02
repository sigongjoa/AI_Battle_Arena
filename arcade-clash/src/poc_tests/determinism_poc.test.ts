// arcade-clash/src/poc_tests/determinism_poc.test.ts

import { GameEngine, GameState, CharacterState, FixedPoint, PlayerInput } from '../shared_game_logic';

describe('Determinism Proof-of-Concept', () => {
    const PLAYER_ID_1 = 'player1';
    const PLAYER_ID_2 = 'player2';
    const FIXED_DELTA_TIME = FixedPoint.fromFloat(1 / 60); // 60 FPS

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
                        jump: i % 30 === 0, // Jump every 30 frames
                        attack: i % 20 === 0, // Attack every 20 frames
                    },
                },
                [PLAYER_ID_2]: {
                    frame: i,
                    playerId: PLAYER_ID_2,
                    inputs: {
                        left: false,
                        right: i % 15 === 0, // Press right every 15 frames
                        jump: i % 40 === 0, // Jump every 40 frames
                        attack: i % 25 === 0, // Attack every 25 frames
                    },
                },
            };
        }
        return inputs;
    };

    it('should produce identical game states across two engine instances with same inputs', () => {
        const NUM_SIMULATION_FRAMES = 500; // Simulate 500 frames
        const INITIAL_RANDOM_SEED = 12345; // Fixed seed for determinism

        // Instance 1
        const engine1 = new GameEngine(createInitialGameState(INITIAL_RANDOM_SEED), FIXED_DELTA_TIME);
        // Instance 2
        const engine2 = new GameEngine(createInitialGameState(INITIAL_RANDOM_SEED), FIXED_DELTA_TIME);

        const inputSequence = generateInputSequence(NUM_SIMULATION_FRAMES);

        for (let frame = 0; frame < NUM_SIMULATION_FRAMES; frame++) {
            const currentFrameInputs = inputSequence[frame];

            // Simulate both engines with the exact same inputs
            engine1.simulateFrame(currentFrameInputs);
            engine2.simulateFrame(currentFrameInputs);

            // Calculate checksums
            const checksum1 = engine1.calculateChecksum();
            const checksum2 = engine2.calculateChecksum();

            // Expect checksums to be identical
            expect(checksum1).toBe(checksum2);

            // Optional: Log state differences if desync occurs for debugging
            if (checksum1 !== checksum2) {
                console.error(`Desync detected at frame ${frame}`);
                console.error('Engine 1 State:', JSON.stringify(engine1.getGameState(), null, 2));
                console.error('Engine 2 State:', JSON.stringify(engine2.getGameState(), null, 2));
                break; // Stop on first desync
            }
        }

        // Final check after all frames
        expect(engine1.calculateChecksum()).toBe(engine2.calculateChecksum());
    });

    it('should produce different game states with different inputs', () => {
        const NUM_SIMULATION_FRAMES = 100;
        const INITIAL_RANDOM_SEED = 54321;

        const engine1 = new GameEngine(createInitialGameState(INITIAL_RANDOM_SEED), FIXED_DELTA_TIME);
        const engine2 = new GameEngine(createInitialGameState(INITIAL_RANDOM_SEED), FIXED_DELTA_TIME);

        const inputSequence1 = generateInputSequence(NUM_SIMULATION_FRAMES);
        const inputSequence2 = generateInputSequence(NUM_SIMULATION_FRAMES);

        // Modify inputs for engine2 at a specific frame to ensure divergence
        if (inputSequence2[50]) {
            inputSequence2[50][PLAYER_ID_1].inputs.left = !inputSequence2[50][PLAYER_ID_1].inputs.left;
            inputSequence2[50][PLAYER_ID_1].inputs.right = !inputSequence2[50][PLAYER_ID_1].inputs.right;
        }

        for (let frame = 0; frame < NUM_SIMULATION_FRAMES; frame++) {
            engine1.simulateFrame(inputSequence1[frame]);
            engine2.simulateFrame(inputSequence2[frame]);

            if (frame >= 50) { // Expect divergence after input change
                const checksum1 = engine1.calculateChecksum();
                const checksum2 = engine2.calculateChecksum();
                if (checksum1 === checksum2) {
                    // This should ideally not happen if inputs diverged
                    console.warn(`States still identical at frame ${frame} despite input divergence.`);
                }
                expect(checksum1).not.toBe(checksum2);
            }
        }
    });
});
