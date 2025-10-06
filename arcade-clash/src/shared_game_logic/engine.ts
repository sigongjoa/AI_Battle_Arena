import { FixedPoint } from './fixed_point';
import { GameState, CharacterState } from './game_state';
import { PlayerInput } from './input_data';
import { CharacterData, AppearanceData, SkillData, ParameterData } from '@/types'; // Import new interfaces

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

    constructor(
        initialState: GameState,
        fixedDeltaTime: FixedPoint,
        localPlayerId: string,
        remotePlayerId: string,
        aiPlayerId: string = 'player1' // Default to player1 for AI control
    ) {
        this.gameState = initialState;
        this.fixedDeltaTime = fixedDeltaTime;
        this.localPlayerId = localPlayerId;
        this.remotePlayerId = remotePlayerId;
        this.aiPlayerId = aiPlayerId;
        this.lastInputActions = { [initialState.player1.id]: 'idle', [initialState.player2.id]: 'idle' };
    }

    public getGameState(): GameState {
        return this.gameState;
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

    public applyExternalAction(actionId: number): void {
        const player = this.gameState[this.aiPlayerId === this.gameState.player1.id ? 'player1' : 'player2'];
        const actionString = mapActionIdToString(actionId);

        // Update last input action for the AI-controlled player
        this.lastInputActions[this.aiPlayerId] = actionString;

        // Apply the action to the player (simplified for now, actual game logic would be here)
        // This part needs to be aligned with the Player class methods as per 구현_알고리즘_명세서.md
        switch (actionString) {
            case 'move_forward':
                player.position.x = player.position.x.add(FixedPoint.fromFloat(0.1)); // Example movement
                break;
            case 'move_backward':
                player.position.x = player.position.x.subtract(FixedPoint.fromFloat(0.1)); // Example movement
                break;
            case 'jump':
                // Simplified jump
                if (player.isGrounded) {
                    player.velocity.y = FixedPoint.fromFloat(0.5);
                    player.isGrounded = false;
                }
                break;
            case 'light_punch':
                // Trigger light punch animation/logic
                player.action = 'attacking';
                break;
            case 'heavy_kick':
                // Trigger heavy kick animation/logic
                player.action = 'attacking';
                break;
            case 'guard':
                player.action = 'guarding';
                break;
            case 'idle':
            default:
                player.action = 'idle';
                break;
        }
    }

    public getLastInputActions(): { p1Action: string, p2Action: string } {
        return {
            p1Action: this.lastInputActions[this.gameState.player1.id],
            p2Action: this.lastInputActions[this.gameState.player2.id],
        };
    }

    public update(localInput: PlayerInput): void {
        // Update last input action for the local player
        this.lastInputActions[localInput.playerId] = this.mapPlayerInputToSimplifiedAction(localInput.inputs);

        // Apply local input to the game state
        const player = this.gameState[localInput.playerId === this.gameState.player1.id ? 'player1' : 'player2'];
        if (localInput.inputs.left) {
            player.position.x = player.position.x.subtract(FixedPoint.fromFloat(0.1));
        } else if (localInput.inputs.right) {
            player.position.x = player.position.x.add(FixedPoint.fromFloat(0.1));
        }
        if (localInput.inputs.jump && player.isGrounded) {
            player.velocity.y = FixedPoint.fromFloat(0.5);
            player.isGrounded = false;
        }
        if (localInput.inputs.attack) {
            player.action = 'attacking';
        } else if (localInput.inputs.guard) {
            player.action = 'guarding';
        } else {
            player.action = 'idle';
        }

        // Simulate gravity
        if (!player.isGrounded) {
            player.velocity.y = player.velocity.y.subtract(FixedPoint.fromFloat(0.05));
            player.position.y = player.position.y.add(player.velocity.y);
            if (player.position.y.toFloat() <= 0) {
                player.position.y = FixedPoint.fromFloat(0);
                player.velocity.y = FixedPoint.fromFloat(0);
                player.isGrounded = true;
            }
        }

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
}
