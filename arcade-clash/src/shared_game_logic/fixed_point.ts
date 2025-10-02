// arcade-clash/src/shared_game_logic/fixed_point.ts

/**
 * @class FixedPoint
 * @description Represents a fixed-point number for deterministic calculations.
 *              This helps avoid floating-point inaccuracies across different platforms.
 */
export class FixedPoint {
    private static readonly FRACTIONAL_BITS = 16; // 2^16 = 65536, provides 4 decimal places of precision
    private static readonly FACTOR = 1 << FixedPoint.FRACTIONAL_BITS; // 65536

    private _value: number; // Internal integer representation

    /**
     * Creates a FixedPoint number from an integer internal value.
     * @param value The internal integer value.
     */
    private constructor(value: number) {
        this._value = value;
    }

    /**
     * Creates a FixedPoint number directly from its raw internal integer value.
     * This is useful for deserialization.
     * @param rawValue The raw integer value.
     * @returns A new FixedPoint instance.
     */
    public static fromRawValue(rawValue: number): FixedPoint {
        return new FixedPoint(rawValue);
    }

    /**
     * Creates a FixedPoint number from a standard JavaScript number (float).
     * @param floatValue The floating-point number to convert.
     * @returns A new FixedPoint instance.
     */
    public static fromFloat(floatValue: number): FixedPoint {
        return new FixedPoint(Math.round(floatValue * FixedPoint.FACTOR));
    }

    /**
     * Creates a FixedPoint number from an integer.
     * @param intValue The integer number to convert.
     * @returns A new FixedPoint instance.
     */
    public static fromInt(intValue: number): FixedPoint {
        return new FixedPoint(intValue * FixedPoint.FACTOR);
    }

    /**
     * Returns the internal integer representation of the FixedPoint number.
     * @returns The internal integer value.
     */
    public get rawValue(): number {
        return this._value;
    }

    /**
     * Custom JSON serialization for FixedPoint.
     * When JSON.stringify is called on a FixedPoint object, this method will be used.
     * @returns An object containing the raw integer value with a special key for identification.
     */
    public toJSON(): { __fp: number } {
        return { __fp: this._value };
    }

    /**
     * Converts the FixedPoint number back to a standard JavaScript number (float).
     * @returns The floating-point representation.
     */
    public toFloat(): number {
        return this._value / FixedPoint.FACTOR;
    }

    /**
     * Converts the FixedPoint number to an integer (truncates fractional part).
     * @returns The integer representation.
     */
    public toInt(): number {
        return Math.floor(this._value / FixedPoint.FACTOR);
    }

    /**
     * Adds another FixedPoint number to this one.
     * @param other The FixedPoint number to add.
     * @returns A new FixedPoint instance representing the sum.
     */
    public add(other: FixedPoint): FixedPoint {
        return new FixedPoint(this._value + other._value);
    }

    /**
     * Subtracts another FixedPoint number from this one.
     * @param other The FixedPoint number to subtract.
     * @returns A new FixedPoint instance representing the difference.
     */
    public subtract(other: FixedPoint): FixedPoint {
        return new FixedPoint(this._value - other._value);
    }

    /**
     * Multiplies this FixedPoint number by another.
     * @param other The FixedPoint number to multiply by.
     * @returns A new FixedPoint instance representing the product.
     */
    public multiply(other: FixedPoint): FixedPoint {
        // (a * b) / FACTOR
        // Use BigInt for intermediate calculation to prevent overflow before division
        // if numbers are large, though for typical game values, number might be sufficient.
        // For maximum determinism and safety, especially with large numbers, BigInt is safer.
        // However, for simplicity and common game ranges, direct number multiplication is often used.
        // Let's stick to number for now as per typical JS game dev, but note potential for BigInt.
        return new FixedPoint(Math.round((this._value * other._value) / FixedPoint.FACTOR));
    }

    /**
     * Divides this FixedPoint number by another.
     * @param other The FixedPoint number to divide by.
     * @returns A new FixedPoint instance representing the quotient.
     * @throws Error if division by zero occurs.
     */
    public divide(other: FixedPoint): FixedPoint {
        if (other._value === 0) {
            throw new Error("Division by zero in FixedPoint.");
        }
        // (a * FACTOR) / b
        return new FixedPoint(Math.round((this._value * FixedPoint.FACTOR) / other._value));
    }

    /**
     * Compares this FixedPoint number with another.
     * @param other The FixedPoint number to compare with.
     * @returns True if the numbers are equal, false otherwise.
     */
    public equals(other: FixedPoint): boolean {
        return this._value === other._value;
    }

    /**
     * Checks if this FixedPoint number is less than another.
     * @param other The FixedPoint number to compare with.
     * @returns True if this number is less than other, false otherwise.
     */
    public lessThan(other: FixedPoint): boolean {
        return this._value < other._value;
    }

    /**
     * Checks if this FixedPoint number is greater than another.
     * @param other The FixedPoint number to compare with.
     * @returns True if this number is greater than other, false otherwise.
     */
    public greaterThan(other: FixedPoint): boolean {
        return this._value > other._value;
    }

    /**
     * Returns the string representation of the FixedPoint number (float representation).
     * @returns The string representation.
     */
    public toString(): string {
        return this.toFloat().toString();
    }
}

// Example usage (for testing/demonstration)
// const fp1 = FixedPoint.fromFloat(10.5);
// const fp2 = FixedPoint.fromFloat(2.5);
// const fp3 = FixedPoint.fromInt(3);

// console.log("fp1:", fp1.toFloat()); // 10.5
// console.log("fp2:", fp2.toFloat()); // 2.5
// console.log("fp3:", fp3.toFloat()); // 3

// const sum = fp1.add(fp2);
// console.log("sum:", sum.toFloat()); // 13.0

// const product = fp1.multiply(fp2);
// console.log("product:", product.toFloat()); // 26.25

// const division = fp1.divide(fp2);
// console.log("division:", division.toFloat()); // 4.2
