import type { State } from "./automaton";

/**
 * A helper class to generate localized alphabetical letters (A, B, C... Z, AA, AB...).
 */
export class LetterGenerator {
    private current: string;

    constructor(initial: string = "A") {
        this.current = initial;
    }

    public next(): string {
        const result = this.current;
        this.increment();
        return result;
    }

    private increment(): void {
        const chars = this.current.split("");
        let carry = true;

        for (let i = chars.length - 1; i >= 0 && carry; i--) {
            if (chars[i] === "Z") {
                chars[i] = "A";
            } else {
                chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
                carry = false;
            }
        }

        this.current = carry ? `A${chars.join("")}` : chars.join("");
    }
}

/**
 * Check if two arrays of states are equal based on their labels.
 */
export function equalStates(statesA: State[], statesB: State[]): boolean {
    if (statesA.length !== statesB.length) return false;

    const labelsA = new Set(statesA.map((s) => s.label));
    const labelsB = new Set(statesB.map((s) => s.label));

    if (labelsA.size !== labelsB.size) return false;

    return Array.from(labelsA).every((label) => labelsB.has(label));
}
