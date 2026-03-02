import type { State } from "@/features/automata/base-automaton";

/**
 * Result returned after evaluating a string through an Automaton.
 */
export type TestResult = {
    /** True if the string is accepted by the automaton. */
    accept: boolean;
    /** Complete path routes resolving the testing execution traversal. */
    routes: Route[];
};

/**
 * Traversal route representing individual node-to-node evaluation paths.
 */
export type Route = {
    /** Indicates if the specific route resulted in an accepted state. */
    valid: boolean;
    /** Array of transitions sequentially stepped into during testing. */
    transitions: Transition[];
};

/**
 * Encapsulates an automaton graph transition step.
 */
export type Transition = {
    /** Initial source state edge object. */
    from: State;
    /** Single char symbol traversed over the arc/edge, undefined if empty transition */
    symbol?: string;
};

/**
 * Base data structure defining transition mappings for a State.
 */
export type TransitionD = {
    /** Unique label defining the deterministic step */
    label: string;
    /** Dictionary linking reachable symbols directly pointing to destiny constraints */
    transitions: Map<string, string | string[]>;
};

/**
 * Global Automaton configuration rules payload.
 */
export type AutomatonConfig = {
    /** The special empty/epsilon character representation limit (usually "ε" or "ϵ"). */
    empty_symbol?: string;
};

/**
 * Data representation of grouped states usually evaluated during Powerset Enclosures.
 */
export type StateD = {
    /** Alias mapped label grouping equivalent underlying original states */
    label: string;
    /** Contained primitive internal states enclosed logically */
    states: State[];
    /** Mark indicating visitation status during generic graph traversal loops */
    marked: boolean;
};

/**
 * Abstract Syntax Tree Node properties parsed from string regex formulas.
 */
export type SyntaxTreeNode = {
    /** 0-indexed string occurrence index indicating starting formula bound. */
    begin: number;
    /** Substring ending bracket bound limitation index. */
    end: number;
    /** Operator token string mapping indicating logical relation */
    type?: string;
    /** Underlying structural children sub-trees logically chained within constraints */
    parts?: SyntaxTreeNode[];
    /** Isolated inner structural tree */
    sub?: SyntaxTreeNode;
    /** Leaf evaluated inner string characters */
    text?: string;
};
