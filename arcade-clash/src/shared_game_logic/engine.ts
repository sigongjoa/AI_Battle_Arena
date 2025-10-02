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

        this._gameState.randomSeed = (this._gameState.randomSeed * 9301 + 49297) % 233280;
    }

    private simulateCharacter(character: CharacterState, input: PlayerInput, dt: FixedPoint): void {
        if (!input) return; // Do nothing if input is missing for a frame

        const gravity = FixedPoint.fromFloat(0.1);
        character.velocity.y = character.velocity.y.subtract(gravity.multiply(dt));

        const moveSpeed = FixedPoint.fromFloat(2);
        if (input.inputs.left) {
            character.velocity.x = character.velocity.x.subtract(moveSpeed.multiply(dt));
        } else if (input.inputs.right) {
            character.velocity.x = character.velocity.x.add(moveSpeed.multiply(dt));
        } else {
            character.velocity.x = character.velocity.x.multiply(FixedPoint.fromFloat(0.9));
            if (Math.abs(character.velocity.x.toFloat()) < 0.1) {
                character.velocity.x = FixedPoint.fromFloat(0);
            }
        }

        character.position.x = character.position.x.add(character.velocity.x.multiply(dt));
        character.position.y = character.position.y.add(character.velocity.y.multiply(dt));

        const groundLevel = FixedPoint.fromFloat(0);
        if (character.position.y.lessThan(groundLevel)) {
            character.position.y = groundLevel;
            character.velocity.y = FixedPoint.fromFloat(0);
            character.isGrounded = true;
        }

        if (input.inputs.attack) {
            // Attack logic would go here
        }
    }

    public calculateChecksum(): string {
        const stateString = JSON.stringify(this._gameState);
        return stateString; // Placeholder for actual hash
    }
}
