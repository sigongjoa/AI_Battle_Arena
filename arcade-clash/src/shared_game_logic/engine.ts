import { FixedPoint } from './fixed_point';
import { GameState, CharacterState } from './game_state';
import { PlayerInput } from './input_data';
import { CharacterData, AppearanceData, SkillData, ParameterData } from '@/types'; // Import new interfaces
import { deepCopyGameState, fixedPointReviver } from './utils'; // Import utility functions

// Helper function to map numeric action IDs to string representations
const mapActionIdToString = (actionId: number): string => {
    switch (actionId) {
        case 0: return 'idle';
        case 1: return 'move_forward';
        case 2: return 'move_backward';
        case 3: return 'jump';
        case 4: return 'light_punch';
        case 5: return 'heavy_kick';
        case 6: return 'guard';
        default: return 'unknown';
    }
};

export class GameEngine {
    private gameState: GameState;
    private fixedDeltaTime: FixedPoint;
    private localPlayerId: string;
    private remotePlayerId: string;
    private aiPlayerId: string; // The ID of the player controlled by AI
    private lastInputActions: { [playerId: string]: string }; // Stores the last input action string for each player

    // --- Checksum and State Management for Rollback POC ---
    private stateHistory: Map<number, GameState> = new Map();

    constructor(
        initialState: GameState,
        fixedDeltaTime: FixedPoint,
        localPlayerId: string,
        remotePlayerId: string,
        aiPlayerId: string = 'player1' // Default to player1 for AI control
    ) {
        this.gameState = deepCopyGameState(initialState); // Ensure initial state is deep copied
        this.fixedDeltaTime = fixedDeltaTime;
        this.localPlayerId = localPlayerId;
        this.remotePlayerId = remotePlayerId;
        this.aiPlayerId = aiPlayerId;
        this.lastInputActions = { [initialState.player1.id]: 'idle', [initialState.player2.id]: 'idle' };
    }

    public getGameState(): GameState {
        return deepCopyGameState(this.gameState); // Return a deep copy to prevent external modification
    }

    public loadGeneratedCharacter(characterData: CharacterData, targetPlayerId: string): void {
        const playerToUpdate = this.gameState.player1.id === targetPlayerId ? this.gameState.player1 : this.gameState.player2;

        // Update player properties based on generated character data
        playerToUpdate.id = characterData.id; // Update ID to generated ID
        playerToUpdate.health = FixedPoint.fromInt(characterData.parameters.health);
        // For now, we'll just update health and action. Other parameters (attackPower, defense, speed)
        // and skills would require more complex game logic integration.
        playerToUpdate.action = 'idle'; // Reset action
        // appearance data would be used by rendering logic, not directly in GameState for now

        console.log(`Loaded generated character ${characterData.theme} for player ${targetPlayerId}`);
    }

    public applyExternalAction(targetPlayerId: string, action: number): void {
        const player = targetPlayerId === this.gameState.player1.id ? this.gameState.player1 : this.gameState.player2;
        // Apply action to the player
        // This will involve mapping the action number to specific game inputs
        // For now, let's assume action directly maps to player's action state
        switch (action) {
            case 0: player.action = 'idle'; break;
            case 1: player.action = 'moving'; player.velocity.x = FixedPoint.fromInt(5); break; // Move right
            case 2: player.action = 'moving'; player.velocity.x = FixedPoint.fromInt(-5); break; // Move left
            case 3: player.action = 'jumping'; player.velocity.y = FixedPoint.fromInt(-10); break; // Jump
            case 4: player.action = 'attacking'; break;
            case 5: player.action = 'guarding'; break;
            default: player.action = 'idle'; break;
        }
    }

    public getLastInputActions(): { p1Action: string, p2Action: string } {
        return {
            p1Action: this.lastInputActions[this.gameState.player1.id],
            p2Action: this.lastInputActions[this.gameState.player2.id],
        };
    }

    public update(localInput: PlayerInput): void {
        // This method is for client-side local input processing
        // For full frame simulation with all player inputs, use simulateFrame
        // For now, we'll just apply the local input directly
        this.applyPlayerInput(localInput);
        this.advanceFrame();
    }

    public simulateFrame(allPlayerInputs: { [playerId: string]: PlayerInput }): void {
        // Apply inputs for all players for this frame
        for (const playerId in allPlayerInputs) {
            if (allPlayerInputs.hasOwnProperty(playerId)) {
                this.applyPlayerInput(allPlayerInputs[playerId]);
            }
        }
        this.advanceFrame();
    }

    private applyPlayerInput(playerInput: PlayerInput): void {
        this.lastInputActions[playerInput.playerId] = this.mapPlayerInputToSimplifiedAction(playerInput.inputs);

        const player = this.gameState[playerInput.playerId === this.gameState.player1.id ? 'player1' : 'player2'];
        if (playerInput.inputs.left) {
            player.position.x = player.position.x.subtract(FixedPoint.fromFloat(0.1));
        } else if (playerInput.inputs.right) {
            player.position.x = player.position.x.add(FixedPoint.fromFloat(0.1));
        }
        if (playerInput.inputs.jump && player.isGrounded) {
            player.velocity.y = FixedPoint.fromFloat(0.5);
            player.isGrounded = false;
        }
        if (playerInput.inputs.attack) {
            player.action = 'attacking';
        } else if (playerInput.inputs.guard) {
            player.action = 'guarding';
        } else {
            player.action = 'idle';
        }
    }

    private advanceFrame(): void {
        // Simulate gravity for both players
        [this.gameState.player1, this.gameState.player2].forEach(player => {
            if (!player.isGrounded) {
                player.velocity.y = player.velocity.y.subtract(FixedPoint.fromFloat(0.05));
                player.position.y = player.position.y.add(player.velocity.y);
                if (player.position.y.toFloat() <= 0) {
                    player.position.y = FixedPoint.fromFloat(0);
                    player.velocity.y = FixedPoint.fromFloat(0);
                    player.isGrounded = true;
                }
            }
        });

        // Advance frame
        this.gameState.frame++;
    }

    // Helper to map PlayerInput.inputs to a simplified action string
    private mapPlayerInputToSimplifiedAction(inputs: PlayerInput['inputs']): string {
        if (inputs.attack) return 'attacking';
        if (inputs.guard) return 'guarding';
        if (inputs.jump) return 'jump';
        if (inputs.left) return 'move_backward'; // Assuming 'left' means move backward relative to facing
        if (inputs.right) return 'move_forward'; // Assuming 'right' means move forward relative to facing
        return 'idle';
    }

    public getObservationForAgent(): number[] {
        // Simplified observation for the agent
        return [
            this.gameState.player1.position.x.toFloat(),
            this.gameState.player1.position.y.toFloat(),
            this.gameState.player1.health.toFloat() / 100,
            // Map player action string to a numeric representation for the agent
            this.mapActionToNumeric(this.gameState.player1.action),
            this.gameState.player2.position.x.toFloat(),
            this.gameState.player2.position.y.toFloat(),
            this.gameState.player2.health.toFloat() / 100,
            this.mapActionToNumeric(this.gameState.player2.action),
        ];
    }

    private mapActionToNumeric(action: CharacterState['action']): number {
        switch (action) {
            case 'idle': return 0;
            case 'walking': return 1; // Assuming walking is move_forward for simplicity in observation
            case 'jumping': return 2;
            case 'attacking': return 3;
            case 'guarding': return 4;
            case 'hitstun': return 5;
            default: return 0;
        }
    }

    public resetForRL(): void {
        // Reset game state to initial values for RL training
        this.gameState = {
            frame: 0,
            randomSeed: 12345,
            player1: {
                id: 'player1',
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
                id: 'player2',
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
        this.lastInputActions = { [this.gameState.player1.id]: 'idle', [this.gameState.player2.id]: 'idle' };
    }

    public calculateChecksum(): string {
        // Create a deterministic string representation of the current game state
        // Use deepCopyGameState to ensure FixedPoint objects are correctly serialized
        const stateForChecksum = deepCopyGameState(this.gameState);
        return JSON.stringify(stateForChecksum);
    }

    public saveState(frame: number): void {
        this.stateHistory.set(frame, deepCopyGameState(this.gameState));
    }

    public loadState(frame: number): boolean {
        const savedState = this.stateHistory.get(frame);
        if (savedState) {
            this.gameState = deepCopyGameState(savedState); // Deep copy to ensure FixedPoint objects are reconstructed
            return true;
        }
        return false;
    }

    public cleanStateHistory(upToFrame: number): void {
        // Remove states older than upToFrame to manage memory
        this.stateHistory.forEach((_, frame) => {
            if (frame < upToFrame) {
                this.stateHistory.delete(frame);
            }
        });
    }
}
