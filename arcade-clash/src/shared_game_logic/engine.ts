import { FixedPoint } from './fixed_point';
import { GameState, CharacterState } from './game_state';
import { PlayerInput } from './input_data';

/**
 * Helper function to recursively reconstruct FixedPoint instances from plain objects.
 * This is necessary because JSON.parse(JSON.stringify()) loses class information.
 * @param obj The object to reconstruct FixedPoint instances within.
 * @returns The object with FixedPoint instances reconstructed.
 */
function reconstructFixedPoint(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(reconstructFixedPoint);
    }

    // Check if it's a plain object that represents a FixedPoint instance
    // We assume an object with a '__fp' property is a serialized FixedPoint.
    if (typeof obj.__fp === 'number' && Object.keys(obj).length === 1) {
        return FixedPoint.fromRawValue(obj.__fp);
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = reconstructFixedPoint(obj[key]);
        }
    }
    return newObj;
}

/**
 * @class GameEngine
 * @description Game engine with integrated rollback netcode logic.
 *              Handles deterministic simulation, input prediction, and state rollback.
 */
export class GameEngine {
    // Core State
    private _gameState: GameState;
    private _stateHistory: Map<number, GameState>;

    // Frame Management
    private _currentFrame: number;
    private _syncFrame: number; // Last frame with confirmed inputs from all players

    // Player & Input Management
    private _localPlayerId: string;
    private _remotePlayerId: string;
    private _playerInputs: Map<number, { [playerId: string]: PlayerInput | null }>;

    // Configuration
    private _fixedDeltaTime: FixedPoint;
    private readonly ROLLBACK_WINDOW: number = 20; // Max frames to rollback

    constructor(initialState: GameState, fixedDeltaTime: FixedPoint, localPlayerId: string, remotePlayerId: string) {
        this._gameState = initialState;
        this._fixedDeltaTime = fixedDeltaTime;
        this._localPlayerId = localPlayerId;
        this._remotePlayerId = remotePlayerId;

        this._currentFrame = initialState.frame;
        this._syncFrame = initialState.frame;

        this._stateHistory = new Map<number, GameState>();
        this._playerInputs = new Map<number, { [playerId: string]: PlayerInput | null }>();

        this.saveState(this._currentFrame);
    }

    // --- Public API ---

    public getGameState(): GameState {
        return reconstructFixedPoint(JSON.parse(JSON.stringify(this._gameState)));
    }

    /**
     * The main update loop for the engine. Called once per frame.
     * It processes local input, predicts remote input, and simulates a frame.
     */
    public update(localInput: PlayerInput): void {
        this._currentFrame++;

        this.storeLocalInput(localInput);
        const remoteInput = this.predictRemoteInput();
        this.storeRemoteInput(remoteInput);

        const inputsForFrame = {
            [this._localPlayerId]: localInput,
            [this._remotePlayerId]: remoteInput,
        };

        this.simulateFrame(inputsForFrame as { [playerId: string]: PlayerInput });
        this.saveState(this._currentFrame);
    }

    /**
     * Called when a remote input packet arrives from the network.
     * It stores the input and triggers the rollback and re-simulation logic.
     */
    public receiveRemoteInput(remoteInput: PlayerInput): void {
        this.storeRemoteInput(remoteInput);
        this.checkAndRollback();
    }

    // --- NEW METHODS FOR RL AGENT CONTROL ---

    public resetForRL(): void {
        // This method re-initializes the game state for a new RL episode.
        const initialState: GameState = {
            frame: 0,
            randomSeed: 12345, // Or a new random seed
            player1: {
                id: this._localPlayerId, // The AI player
                position: { x: FixedPoint.fromFloat(-5), y: FixedPoint.fromFloat(0) },
                velocity: { x: FixedPoint.fromFloat(0), y: FixedPoint.fromFloat(0) },
                health: FixedPoint.fromInt(100),
                isGrounded: true,
                action: 'idle',
                actionFrame: 0,
                hitbox: null,
                hurtbox: { x: FixedPoint.fromFloat(-0.5), y: FixedPoint.fromFloat(0), width: FixedPoint.fromFloat(1), height: FixedPoint.fromFloat(1) },
            },
            player2: {
                id: this._remotePlayerId, // The opponent
                position: { x: FixedPoint.fromFloat(5), y: FixedPoint.fromFloat(0) },
                velocity: { x: FixedPoint.fromFloat(0), y: FixedPoint.fromFloat(0) },
                health: FixedPoint.fromInt(100),
                isGrounded: true,
                action: 'idle',
                actionFrame: 0,
                hitbox: null,
                hurtbox: { x: FixedPoint.fromFloat(-0.5), y: FixedPoint.fromFloat(0), width: FixedPoint.fromFloat(1), height: FixedPoint.fromFloat(1) },
            },
        };
        this._gameState = initialState;
        this._currentFrame = 0;
        this._syncFrame = 0;
        this._stateHistory.clear();
        this._playerInputs.clear();
        this.saveState(0);
        console.log("GameEngine: State has been reset for RL.");
    }

    public applyExternalAction(action: number): void {
        const aiPlayerId = this._localPlayerId; // In RL mode, localPlayerId is the AI

        const generatedInput: PlayerInput = {
            frame: this.getGameState().frame + 1,
            playerId: aiPlayerId,
            inputs: {
                left: action === 2, // MOVE_BWD
                right: action === 1, // MOVE_FWD
                jump: action === 3, // JUMP
                attack: action === 4 || action === 5, // ATTACK_1 or ATTACK_2
                guard: false, // TODO: Add guard to action space if needed
            },
        };
        
        // In RL mode, the opponent can have a dummy input or a simple built-in AI.
        const opponentInput: PlayerInput = {
            frame: this.getGameState().frame + 1,
            playerId: this._remotePlayerId,
            inputs: { left: false, right: false, jump: false, attack: false, guard: false },
        };

        this._currentFrame++;
        this.storeLocalInput(generatedInput);
        this.storeRemoteInput(opponentInput);

        const inputsForFrame = {
            [this._localPlayerId]: generatedInput,
            [this._remotePlayerId]: opponentInput,
        };

        this.simulateFrame(inputsForFrame as { [playerId: string]: PlayerInput });
        this.saveState(this._currentFrame);
    }

    public getObservationForAgent(): number[] {
        const state = this._gameState;
        const p1 = state.player1;
        const p2 = state.player2;

        // TODO: Use actual world/screen dimensions for normalization instead of hardcoded values
        const WORLD_WIDTH = 20; 
        const MAX_HEALTH = 100;

        const normalizeX = (val: FixedPoint) => (val.toFloat() / (WORLD_WIDTH / 2) + 1) / 2;
        const normalizeHealth = (val: FixedPoint) => val.toFloat() / MAX_HEALTH;
        
        const mapActionToNumber = (action: string): number => {
            switch(action) {
                case 'idle': return 0;
                case 'moving': return 1;
                case 'attacking': return 2;
                case 'hitstun': return 3;
                case 'guarding': return 4;
                default: return 0;
            }
        }

        const observation = [
            normalizeX(p1.position.x),
            p1.position.y.toFloat(), // Assuming y is already in a good range
            normalizeHealth(p1.health),
            mapActionToNumber(p1.action),
            normalizeX(p2.position.x),
            p2.position.y.toFloat(),
            normalizeHealth(p2.health),
            mapActionToNumber(p2.action),
        ];

        return observation;
    }

    // --- State Management & Rollback ---

    private saveState(frame: number): void {
        this._stateHistory.set(frame, this.getGameState());
        this.cleanStateHistory();
    }

    private loadState(frame: number): boolean {
        const state = this._stateHistory.get(frame);
        if (state) {
            this._gameState = reconstructFixedPoint(JSON.parse(JSON.stringify(state)));
            return true;
        }
        console.error(`Failed to load state for frame ${frame}`);
        return false;
    }

    private cleanStateHistory(): void {
        const oldestFrameToKeep = this._syncFrame - 1;
        for (const frame of this._stateHistory.keys()) {
            if (frame < oldestFrameToKeep) {
                this._stateHistory.delete(frame);
                this._playerInputs.delete(frame);
            }
        }
    }

    private checkAndRollback(): void {
        let frameToProcess = this._syncFrame + 1;

        while (frameToProcess <= this._currentFrame) {
            const localInput = this.getInputForFrame(frameToProcess, this._localPlayerId);
            const remoteInput = this.getInputForFrame(frameToProcess, this._remotePlayerId);

            // If we have confirmed inputs for this frame, we can advance the syncFrame
            if (localInput && remoteInput) {
                const predictedRemoteInput = this.predictRemoteInput(frameToProcess - 1);

                // If the actual remote input doesn't match our prediction, we must rollback.
                if (JSON.stringify(remoteInput.inputs) !== JSON.stringify(predictedRemoteInput.inputs)) {
                    console.log(`Mis-prediction at frame ${frameToProcess}. Rolling back.`);
                    this.rollback(frameToProcess);
                    return; // Exit after rollback, the simulation is now corrected.
                }

                // Prediction was correct, advance syncFrame
                this._syncFrame = frameToProcess;
                frameToProcess++;
            } else {
                // We don't have confirmed inputs for this frame yet, so stop checking.
                break;
            }
        }
    }

    private rollback(rollbackFrame: number): void {
        // Load the last known good state before the mis-prediction
        if (!this.loadState(rollbackFrame - 1)) {
            return; // Cannot rollback if state doesn't exist
        }

        // Re-simulate from the rollbackFrame to the currentFrame
        for (let frame = rollbackFrame; frame <= this._currentFrame; frame++) {
            const localInput = this.getInputForFrame(frame, this._localPlayerId, true);
            const remoteInput = this.getInputForFrame(frame, this._remotePlayerId, true);

            const inputsForFrame = {
                [this._localPlayerId]: localInput,
                [this._remotePlayerId]: remoteInput,
            };

            this.simulateFrame(inputsForFrame as { [playerId: string]: PlayerInput });
            this.saveState(frame); // Overwrite the incorrect history with the corrected one
        }
    }

    // --- Input Handling & Prediction ---

    private storeLocalInput(input: PlayerInput): void {
        if (!this._playerInputs.has(input.frame)) {
            this._playerInputs.set(input.frame, {});
        }
        this._playerInputs.get(input.frame)![this._localPlayerId] = input;
    }

    private storeRemoteInput(input: PlayerInput): void {
        if (!this._playerInputs.has(input.frame)) {
            this._playerInputs.set(input.frame, {});
        }
        // Don't overwrite a confirmed input with a prediction
        const existingInput = this._playerInputs.get(input.frame)![this._remotePlayerId];
        if (existingInput && !this.isPredictedInput(existingInput)) {
            return;
        }
        this._playerInputs.get(input.frame)![this._remotePlayerId] = input;
    }

    private getInputForFrame(frame: number, playerId: string, ignorePrediction: boolean = false): PlayerInput | null {
        const inputs = this._playerInputs.get(frame);
        const input = inputs ? inputs[playerId] : null;
        if (ignorePrediction && input && this.isPredictedInput(input)) {
            return null;
        }
        return input || null;
    }

    private predictRemoteInput(frame: number = this._currentFrame): PlayerInput {
        // Simple prediction: reuse the last known input for the remote player
        let lastKnownInput = null;
        for (let i = frame - 1; i >= this._syncFrame; i--) {
            const input = this.getInputForFrame(i, this._remotePlayerId);
            if (input) {
                lastKnownInput = input;
                break;
            }
        }

        // If no recent input, create a default (no action) input
        if (!lastKnownInput) {
            lastKnownInput = {
                frame: frame,
                playerId: this._remotePlayerId,
                inputs: { left: false, right: false, jump: false, attack: false },
            };
        }

        return {
            ...lastKnownInput,
            frame: frame, // Update frame number for the prediction
            isPrediction: true, // Mark this input as a prediction
        } as PlayerInput & { isPrediction?: boolean };
    }

    private isPredictedInput(input: PlayerInput): boolean {
        return (input as any).isPrediction === true;
    }


    // --- Core Simulation (Deterministic) ---

    private simulateFrame(inputs: { [playerId: string]: PlayerInput }): void {
        this._gameState.frame++;

        this.simulateCharacter(this._gameState.player1, inputs[this._gameState.player1.id], this._fixedDeltaTime);
        this.simulateCharacter(this._gameState.player2, inputs[this._gameState.player2.id], this._fixedDeltaTime);

        this.handleCollisions();

        this._gameState.randomSeed = (this._gameState.randomSeed * 9301 + 49297) % 233280;
    }

    private simulateCharacter(character: CharacterState, input: PlayerInput, dt: FixedPoint): void {
        if (!input) return; // Do nothing if input is missing for a frame

        // 1. Determine character action state from input
        let newAction = character.action;
        const canStartAction = character.action === 'idle' || character.action === 'moving';

        if (canStartAction) {
            if (input.inputs.attack) {
                newAction = 'attacking';
            } else if (input.inputs.guard) {
                newAction = 'guarding';
            } else if (input.inputs.left || input.inputs.right) {
                newAction = 'moving';
            } else {
                newAction = 'idle';
            }
        }

        // Reset actionFrame if the action has changed
        if (newAction !== character.action) {
            character.action = newAction;
            character.actionFrame = 0;
        } else {
            character.actionFrame++;
        }

        // 2. Update state based on action
        character.hitbox = null; // Reset hitbox each frame

        switch (character.action) {
            case 'attacking':
                // Simple attack: active for a few frames, then return to idle
                if (character.actionFrame >= 2 && character.actionFrame <= 4) {
                    character.hitbox = { active: true, x: FixedPoint.fromFloat(0.6), y: FixedPoint.fromFloat(0.5), width: FixedPoint.fromFloat(0.8), height: FixedPoint.fromFloat(0.3) };
                }
                if (character.actionFrame > 5) {
                    character.action = 'idle';
                }
                break;

            case 'hitstun':
                // Can't do anything while in hitstun
                if (character.actionFrame > 7) { // Stun for 7 frames
                    character.action = 'idle';
                }
                break;

            case 'guarding':
                // Stop horizontal movement instantly when guarding
                character.velocity.x = FixedPoint.fromFloat(0);
                break;

            case 'moving':
            case 'idle':
                const moveSpeed = FixedPoint.fromFloat(2);
                if (input.inputs.left) {
                    character.velocity.x = character.velocity.x.subtract(moveSpeed.multiply(dt));
                } else if (input.inputs.right) {
                    character.velocity.x = character.velocity.x.add(moveSpeed.multiply(dt));
                } else {
                    // Simple friction
                    character.velocity.x = character.velocity.x.multiply(FixedPoint.fromFloat(0.9));
                    if (Math.abs(character.velocity.x.toFloat()) < 0.1) {
                        character.velocity.x = FixedPoint.fromFloat(0);
                    }
                }
                break;
        }

        // 3. Apply physics
        const gravity = FixedPoint.fromFloat(0.1);
        character.velocity.y = character.velocity.y.subtract(gravity.multiply(dt));

        character.position.x = character.position.x.add(character.velocity.x.multiply(dt));
        character.position.y = character.position.y.add(character.velocity.y.multiply(dt));

        const groundLevel = FixedPoint.fromFloat(0);
        if (character.position.y.lessThan(groundLevel)) {
            character.position.y = groundLevel;
            character.velocity.y = FixedPoint.fromFloat(0);
            character.isGrounded = true;
        }
    }

    private doBoxesOverlap(p1: CharacterState, p2: CharacterState): boolean {
        if (!p1.hitbox || !p1.hitbox.active) return false;

        const p1Hitbox = {
            left: p1.position.x.add(p1.hitbox.x),
            right: p1.position.x.add(p1.hitbox.x).add(p1.hitbox.width),
            top: p1.position.y.add(p1.hitbox.y),
            bottom: p1.position.y.add(p1.hitbox.y).subtract(p1.hitbox.height),
        };

        const p2Hurtbox = {
            left: p2.position.x.add(p2.hurtbox.x),
            right: p2.position.x.add(p2.hurtbox.x).add(p2.hurtbox.width),
            top: p2.position.y.add(p2.hurtbox.y),
            bottom: p2.position.y.add(p2.hurtbox.y).subtract(p2.hurtbox.height),
        };

        // AABB collision detection
        return p1Hitbox.left.lessThan(p2Hurtbox.right) &&
               p1Hitbox.right.greaterThan(p2Hurtbox.left) &&
               p1Hitbox.bottom.lessThan(p2Hurtbox.top) &&
               p1Hitbox.top.greaterThan(p2Hurtbox.bottom);
    }

    private handleCollisions(): void {
        const { player1, player2 } = this._gameState;

        // Check P1 hitting P2
        if (this.doBoxesOverlap(player1, player2)) {
            if (player2.action !== 'guarding') {
                player2.action = 'hitstun';
                player2.actionFrame = 0;
                player2.health = player2.health.subtract(FixedPoint.fromInt(10));
            }
        }

        // Check P2 hitting P1
        if (this.doBoxesOverlap(player2, player1)) {
            if (player1.action !== 'guarding') {
                player1.action = 'hitstun';
                player1.actionFrame = 0;
                player1.health = player1.health.subtract(FixedPoint.fromInt(10));
            }
        }
    }

    public calculateChecksum(): string {
        const stateString = JSON.stringify(this._gameState);
        return stateString; // Placeholder for actual hash
    }
}
