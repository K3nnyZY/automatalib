/**
 * Result returned after evaluating a string through an Automaton.
 */
type TestResult = {
    /** True if the string is accepted by the automaton. */
    accept: boolean;
    /** Complete path routes resolving the testing execution traversal. */
    routes: Route[];
};
/**
 * Traversal route representing individual node-to-node evaluation paths.
 */
type Route = {
    /** Indicates if the specific route resulted in an accepted state. */
    valid: boolean;
    /** Array of transitions sequentially stepped into during testing. */
    transitions: Transition[];
};
/**
 * Encapsulates an automaton graph transition step.
 */
type Transition = {
    /** Initial source state edge object. */
    from: State;
    /** Single char symbol traversed over the arc/edge, undefined if empty transition */
    symbol?: string;
};
/**
 * Base data structure defining transition mappings for a State.
 */
type TransitionD = {
    /** Unique label defining the deterministic step */
    label: string;
    /** Dictionary linking reachable symbols directly pointing to destiny constraints */
    transitions: Map<string, string | string[]>;
};
/**
 * Global Automaton configuration rules payload.
 */
type AutomatonConfig = {
    /** The special empty/epsilon character representation limit (usually "ε" or "ϵ"). */
    empty_symbol?: string;
};
/**
 * Data representation of grouped states usually evaluated during Powerset Enclosures.
 */
type StateD = {
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
type SyntaxTreeNode = {
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

/**
 * A discrete logical State within the Automaton containing edges and attributes.
 */
declare class State {
    /** The unique state label */
    label: number | string;
    /** Complete edge paths originating from this state */
    next: Edge[];
    /** Mark representing whether traversal up to this state confirms string acceptance */
    accept: boolean;
    constructor(label: number | string);
    addNext(symbol: string, state: State): void;
}
/**
 * Inner class tracking directed directional edge symbols from States.
 */
declare class Edge {
    /** The character input transitioning over the graph edge */
    symbol: string;
    /** The directional pointing target state bound to this step */
    to: State;
    constructor(symbol: string, to: State);
}
declare class TransitionsTable {
    table: Set<TransitionD>;
    constructor();
    get(label: string): TransitionD | null;
    add(fromLabel: string, symbol?: string, toLabel?: string, emptySymbol?: string): void;
    clone(): TransitionsTable;
}
/**
 * The core engine of logic machines (Finite Automaton) providing building schemas and tests.
 */
declare abstract class Automaton {
    /** The singleton entry-point starting node for evaluation graph parsing */
    initial_state: State;
    /** Internal isolated array preserving accepting final states mapping constraints */
    accept_states: State[];
    /** Custom configurations over generic behavior overrides */
    protected config?: AutomatonConfig;
    /** Global empty deterministic transition limit character ("ϵ" / "ε") */
    protected empty_symbol: string;
    constructor(data: string, config?: AutomatonConfig);
    protected abstract build(data: string): [State, State[]];
    cytograph(): object[];
    move(states: State | State[], symbol: string): State[];
    /**
     * Tests the generic matching runtime compatibility over an explicit string input string.
     * Traversing the initialized states following valid arc-edge strings paths against the internal N/DFA engine.
     *
     * @param input Raw testing phrase evaluating whether it respects automata language sets.
     * @throws Validates string payload length limitations checking rejecting meta-characters constraints.
     * @returns Detailed Test Result payload matching routes status payload
     */
    test(input: string): TestResult;
}

/**
 * Mathematical compiler transforming string formula literals into logical Abstract Syntax Tree (AST) Graphs.
 */
declare class RegExp {
    /** The human-readable source regular expression phrase */
    expression: string;
    /** Mathematical node hierarchical structure evaluated recursively */
    syntax_tree: SyntaxTreeNode;
    /** Extracted uniquely preserved language terminal alphabet character set */
    symbols: string[];
    /** Internal epsilon representing empty transitions limits */
    protected empty_symbol: string;
    constructor(expression: string, empty_symbol: string);
    /**
     * Parse a regular expression into a syntax tree.
     *
     * Originally from:
     * https://github.com/CyberZHG/toolbox/blob/gh-pages/js/lexical.js
     *
     * This function was modified for this project.
     @returns The syntax tree of the regular expression
     */
    protected parse(): SyntaxTreeNode;
    /**
     * Extracts all unique symbols from the regex string.
     * @returns An array of unique symbols.
     */
    protected extractSymbols(): string[];
}

/**
 * Non-Deterministic Finite Automaton (NFA) resolving engine applying mathematical Thompson's construction.
 */
declare class NFA extends Automaton {
    /** Embedded internal regex compiled instance containing the parsed Syntax Tree */
    regexp: RegExp;
    /**
     * The transition table of the DFA.
     */
    transitions: TransitionsTable;
    constructor(expression: string, config?: AutomatonConfig);
    protected build(expression: string): [State, State[]];
    /**
     * Enclose the automaton with states. By default, the enclosure is done with empty symbol transitions.
     * @param T - The state or states to be enclosed
     * @param symbol - The symbol to be used for enclosure
     * @returns The set of states reachable from the given states
     */
    enclosure(T: State | State[], symbol?: string): State[];
    protected generateTransitionsTable(): void;
}

/**
 * Encapsulates unique logic identifying equivalent states structures
 * for merging nodes natively mapped through an internal set.
 */
declare class StatesTable {
    table: Set<StateD>;
    constructor();
    get(states: State[]): StateD | null;
    add(label: string, states: State[]): void;
    getUnmarked(): StateD | null;
    clone(): StatesTable;
}
/**
 * Deterministic Finite Automaton (DFA) base abstract logic interface.
 * Ensures the underlying NFA generates specific one-way paths matching formulas.
 */
declare abstract class DFA extends Automaton {
    /** Unoptimized underlying NFA component reference graph */
    NFA: NFA;
    /** Internal grouping states graph mappings generated from algorithm implementations */
    states: StatesTable;
    /** Strict 1-to-1 deterministic transitions matrix derived from Subset Construction */
    transitions: TransitionsTable;
    protected lookUp(label: string, states: Set<State>): State | null;
    protected generateGraph(): Set<State>;
    protected abstract initializeStates(graphStates: Set<State>): [State, State[]];
}

/**
 * Unoptimized Deterministic Finite Automaton.
 * Formed from an underlying NFA applying the canonical Subset Construction (Powerset construction) algorithm.
 */
declare class uDFA extends DFA {
    constructor(expression: string, config?: AutomatonConfig);
    protected build(expression: string): [State, State[]];
    protected initializeStates(graphStates: Set<State>): [State, State[]];
}

/**
 * Internal mapping tracker linking combined identifiers from minimized Equivalent States.
 */
declare class Identifiables {
    table: Map<string, Set<string>>;
    constructor();
    add(label: string, identical: string): void;
}
/**
 * Minimized Deterministic Finite Automaton (mDFA).
 * The fully optimized structure grouping equivalent unreachable and identical discrete nodes.
 */
declare class mDFA extends DFA {
    /** Unoptimized underlying DFA resolved initially using Subset Construction */
    uDFA: uDFA;
    /** Internal tracking mapping equivalent state nodes combinations */
    equivalent_states: StatesTable;
    /** History preserving replaced state identicals */
    identifiables: Identifiables;
    constructor(expression: string, config?: AutomatonConfig);
    protected build(expression: string): [State, State[]];
    protected initializeStates(graphStates: Set<State>): [State, State[]];
    protected equivalentStates(states: StatesTable): StatesTable;
    protected reduce(equivalentStates: StatesTable, transitions: TransitionsTable): [StatesTable, TransitionsTable];
}

export { Automaton, type AutomatonConfig, DFA, NFA, RegExp, type Route, State, type StateD, StatesTable, type SyntaxTreeNode, type TestResult, type Transition, type TransitionD, TransitionsTable, mDFA, uDFA };
