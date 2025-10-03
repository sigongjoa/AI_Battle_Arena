// arcade-clash/src/shared_game_logic/game_state.ts

import { FixedPoint } from './fixed_point';

/**
 * @interface CharacterState
 * @description Represents the deterministic state of a single character.
 */
export interface CharacterState {
    id: string;
    position: { x: FixedPoint; y: FixedPoint; };
    velocity: { x: FixedPoint; y: FixedPoint; };
    health: FixedPoint;
    isGrounded: boolean;
    action: 'idle' | 'moving' | 'attacking' | 'guarding' | 'hitstun';
    actionFrame: number;
    hitbox: { active: boolean, x: FixedPoint, y: FixedPoint, width: FixedPoint, height: FixedPoint } | null;
    hurtbox: { x: FixedPoint, y: FixedPoint, width: FixedPoint, height: FixedPoint };
    // Add other deterministic character properties as needed for the PoC
}

/**
 * @interface GameState
 * @description Represents the complete deterministic state of the game at a given frame.
 */
export interface GameState {
    frame: number;
    player1: CharacterState;
    player2: CharacterState;
    randomSeed: number; // For deterministic random number generation
    // Add other deterministic game properties as needed for the PoC
}
