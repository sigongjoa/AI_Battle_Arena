import { FixedPoint } from './fixed_point';
import { GameState } from './game_state';

/**
 * A JSON reviver function to reconstruct FixedPoint instances from their serialized format.
 * Use with JSON.parse(jsonString, fixedPointReviver).
 */
export function fixedPointReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.hasOwnProperty('__fp')) {
        return FixedPoint.fromRawValue(value.__fp);
    }
    return value;
}

/**
 * Creates a deep copy of a GameState object, correctly handling FixedPoint instances.
 * @param gameState The GameState object to copy.
 * @returns A new, deep-copied GameState object.
 */
export function deepCopyGameState(gameState: GameState): GameState {
    // Use JSON.stringify with FixedPoint.toJSON() and JSON.parse with fixedPointReviver
    // to ensure FixedPoint instances are correctly serialized and deserialized.
    return JSON.parse(JSON.stringify(gameState), fixedPointReviver);
}
