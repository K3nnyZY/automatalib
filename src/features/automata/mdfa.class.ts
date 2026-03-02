import {
  State,
  TransitionsTable,
} from "./base-automaton";
import type { AutomatonConfig, TransitionD, StateD } from "@/types/automata";
import { DFA, StatesTable } from "./dfa.class";
import { equalStates } from "./automata.utils";
import { uDFA } from "./udfa.class";

/**
 * Internal mapping tracker linking combined identifiers from minimized Equivalent States.
 */
class Identifiables {
  public table: Map<string, Set<string>>;

  constructor() {
    this.table = new Map();
  }

  public add(label: string, identical: string): void {
    if (!this.table.has(label)) {
      this.table.set(label, new Set<string>());
    }
    this.table.get(label)?.add(identical);
  }
}

/**
 * Minimized Deterministic Finite Automaton (mDFA).
 * The fully optimized structure grouping equivalent unreachable and identical discrete nodes.
 */
export class mDFA extends DFA {
  /** Unoptimized underlying DFA resolved initially using Subset Construction */
  public uDFA!: uDFA;
  /** Internal tracking mapping equivalent state nodes combinations */
  public equivalent_states!: StatesTable;
  /** History preserving replaced state identicals */
  public identifiables!: Identifiables;

  constructor(expression: string, config?: AutomatonConfig) {
    super(expression, config);
  }

  protected build(expression: string): [State, State[]] {
    const udfa = new uDFA(expression, this.config);

    this.NFA = udfa.NFA;
    this.uDFA = udfa;

    this.equivalent_states = this.equivalentStates(udfa.states);
    [this.states, this.transitions] = this.reduce(
      this.equivalent_states,
      udfa.transitions,
    );

    const graphStates = this.generateGraph();
    return this.initializeStates(graphStates);
  }

  protected initializeStates(graphStates: Set<State>): [State, State[]] {
    const initialState = (() => {
      for (const entry of this.states.table) {
        if (entry.label === this.uDFA.initial_state.label) {
          return this.lookUp(entry.label, graphStates) as State;
        }
      }
      return null;
    })() as State;

    const acceptStates: State[] = [];
    for (const entry of this.states.table) {
      for (const state of entry.states) {
        if (state.label === this.NFA.accept_states[0].label) {
          const matchedState = this.lookUp(entry.label, graphStates);
          if (matchedState) acceptStates.push(matchedState);
        }
      }
    }

    return [initialState, acceptStates];
  }

  protected equivalentStates(states: StatesTable): StatesTable {
    const newTable = states.clone();
    const emptySymbol = this.empty_symbol;

    const isSignificant = (state: State): boolean => {
      if (state.accept) return true;
      if (state.next.length > 0 && state.next[0].symbol !== emptySymbol) {
        return true;
      }
      return false;
    };

    for (const entry of newTable.table) {
      entry.states = entry.states.filter(isSignificant);
    }

    return newTable;
  }

  protected reduce(
    equivalentStates: StatesTable,
    transitions: TransitionsTable,
  ): [StatesTable, TransitionsTable] {
    this.identifiables = new Identifiables();

    let newStates = Array.from(equivalentStates.table);
    const newTransitions = Array.from(transitions.table);

    const replaceLabel = (newLabel: string, oldLabel: string) => {
      for (let i = newTransitions.length - 1; i >= 0; i--) {
        if (newTransitions[i].label === oldLabel) {
          newTransitions.splice(i, 1);
        }
      }

      for (const tD of newTransitions) {
        tD.transitions.forEach((dest: string | string[], symbol: string) => {
          if (dest === oldLabel) {
            tD.transitions.set(symbol, newLabel);
          }
        });
      }
    };

    for (let i = 0; i < newStates.length; i++) {
      for (let j = i + 1; j < newStates.length; j++) {
        if (equalStates(newStates[i].states, newStates[j].states)) {
          const newLabel = newStates[i].label;
          const oldLabel = newStates[j].label;

          replaceLabel(newLabel, oldLabel);
          this.identifiables.add(newLabel, oldLabel);

          newStates.splice(j, 1);
          j--;
        }
      }
    }

    const mdfaStates = new StatesTable();
    mdfaStates.table = new Set(newStates);

    const mdfaTransitions = new TransitionsTable();
    mdfaTransitions.table = new Set(newTransitions);

    return [mdfaStates, mdfaTransitions];
  }
}
