import { RegExp } from "./regex.class";
import {
  State,
  Automaton,
  TransitionsTable,
} from "./base-automaton";
import type { SyntaxTreeNode, AutomatonConfig } from "@/types/automata";

/**
 * Non-Deterministic Finite Automaton (NFA) resolving engine applying mathematical Thompson's construction.
 */
export class NFA extends Automaton {
  /** Embedded internal regex compiled instance containing the parsed Syntax Tree */
  declare public regexp: RegExp;
  /**
   * The transition table of the DFA.
   */
  declare public transitions: TransitionsTable;

  constructor(expression: string, config?: AutomatonConfig) {
    super(expression, config);
    this.generateTransitionsTable();
  }

  protected build(expression: string): [State, State[]] {
    const emptySymbol = this.empty_symbol;
    let label = 0;

    const generateGraph = (stNode: SyntaxTreeNode, initialState: State): State => {
      switch (stNode.type) {
        case "empty": {
          const acceptState = new State(++label);
          initialState.addNext(emptySymbol, acceptState);
          return acceptState;
        }

        case "text": {
          const letter = stNode.text as string;
          const acceptState = new State(++label);
          initialState.addNext(letter, acceptState);
          return acceptState;
        }

        case "or": {
          const lastStates: State[] = [];
          for (const part of stNode.parts as SyntaxTreeNode[]) {
            const nextState = new State(++label);
            initialState.addNext(emptySymbol, nextState);
            const lastState = generateGraph(part, nextState);
            lastStates.push(lastState);
          }

          const acceptState = new State(++label);
          for (const state of lastStates) {
            state.addNext(emptySymbol, acceptState);
          }
          return acceptState;
        }

        case "cat": {
          let prevState = initialState;
          for (const part of stNode.parts as SyntaxTreeNode[]) {
            prevState = generateGraph(part, prevState);
          }
          return prevState;
        }

        case "star":
        case "plus":
        case "optional": {
          const tempInitialState = new State(++label);
          initialState.addNext(emptySymbol, tempInitialState);

          const tempAcceptState = generateGraph(
            stNode.sub as SyntaxTreeNode,
            tempInitialState,
          );

          if (stNode.type === "star" || stNode.type === "plus") {
            tempAcceptState.addNext(emptySymbol, tempInitialState);
          }

          const acceptState = new State(++label);
          tempAcceptState.addNext(emptySymbol, acceptState);

          if (stNode.type === "star" || stNode.type === "optional") {
            initialState.addNext(emptySymbol, acceptState);
          }

          return acceptState;
        }

        default:
          throw new Error(`Unknown node type: ${stNode.type}`);
      }
    };

    this.regexp = new RegExp(expression, this.empty_symbol);
    const st = this.regexp.syntax_tree;

    const initialState = new State(label);
    const finalState = generateGraph(st, initialState);

    return [initialState, [finalState]];
  }

  /**
   * Enclose the automaton with states. By default, the enclosure is done with empty symbol transitions.
   * @param T - The state or states to be enclosed
   * @param symbol - The symbol to be used for enclosure
   * @returns The set of states reachable from the given states
   */
  public enclosure(
    T: State | State[],
    symbol: string = this.empty_symbol,
  ): State[] {
    const reacheable_states = new Set<State>();

    // Use depth-first search algorithm
    function DFS(state: State) {
      if (reacheable_states.has(state)) return;
      reacheable_states.add(state);

      for (const edge of state.next) {
        if (edge.symbol == symbol) {
          DFS(edge.to);
        }
      }
    }

    // Check if T is an array or a single state
    if (Array.isArray(T)) {
      for (const state of T) {
        DFS(state);
      }
    } else {
      DFS(T);
    }

    return Array.from(reacheable_states);
  }

  protected generateTransitionsTable(): void {
    const empty_symbol = this.empty_symbol;
    this.transitions = new TransitionsTable();
    const visited = new Set();

    // Use depth-first search algorithm
    function DFS(transitions: TransitionsTable, state: State) {
      if (visited.has(state)) return;
      visited.add(state);

      if (state.next.length == 0) {
        transitions.add(state.label.toString());
      }

      for (const edge of state.next) {
        transitions.add(
          state.label.toString(),
          edge.symbol,
          edge.to.label.toString(),
          empty_symbol,
        );

        DFS(transitions, edge.to);
      }
    }

    DFS(this.transitions, this.initial_state);
  }
}
