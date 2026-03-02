import type { State } from "@/features/automata/automaton";

export type TestResult = {
    accept: boolean;
    routes: Route[];
};

export type Route = {
    valid: boolean;
    transitions: Transition[];
};

export type Transition = {
    from: State;
    symbol?: string;
};

export type TransitionD = {
    label: string;
    transitions: Map<string, string | string[]>;
};

export type AutomatonConfig = {
    empty_symbol?: string;
};

export type StateD = {
    label: string;
    states: State[];
    marked: boolean;
};

export type SyntaxTreeNode = {
    begin: number;
    end: number;
    type?: string;
    parts?: SyntaxTreeNode[];
    sub?: SyntaxTreeNode;
    text?: string;
};
