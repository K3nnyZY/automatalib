import { Automaton, State, TransitionsTable } from "./base-automaton";
import { NFA } from "./nfa.class";
import { equalStates } from "./automata.utils";
import type { StateD } from "@/types/automata";

/**
 * Encapsulates unique logic identifying equivalent states structures 
 * for merging nodes natively mapped through an internal set.
 */
export class StatesTable {
  public table: Set<StateD>;

  constructor() {
    this.table = new Set();
  }

  public get(states: State[]): StateD | null {
    for (const row of this.table) {
      if (equalStates(row.states, states)) return row;
    }
    return null;
  }

  public add(label: string, states: State[]): void {
    this.table.add({ label, states, marked: false });
  }

  public getUnmarked(): StateD | null {
    for (const row of this.table) {
      if (!row.marked) return row;
    }
    return null;
  }

  public clone(): StatesTable {
    const newTable = new StatesTable();
    for (const entry of this.table) {
      newTable.table.add({ ...entry, states: [...entry.states] });
    }
    return newTable;
  }
}

/**
 * Deterministic Finite Automaton (DFA) base abstract logic interface.
 * Ensures the underlying NFA generates specific one-way paths matching formulas.
 */
export abstract class DFA extends Automaton {
  /** Unoptimized underlying NFA component reference graph */
  declare public NFA: NFA;
  /** Internal grouping states graph mappings generated from algorithm implementations */
  declare public states: StatesTable;
  /** Strict 1-to-1 deterministic transitions matrix derived from Subset Construction */
  declare public transitions: TransitionsTable;

  protected lookUp(label: string, states: Set<State>): State | null {
    for (const state of states) {
      if (state.label === label) return state;
    }
    return null;
  }

  protected generateGraph(): Set<State> {
    const newStates = new Set<State>();
    const stateMap = new Map<string, State>();

    for (const entry of this.states.table) {
      const state = new State(entry.label);
      newStates.add(state);
      stateMap.set(entry.label, state);
    }

    for (const entry of this.transitions.table) {
      const state = stateMap.get(entry.label);
      if (!state) continue;

      entry.transitions.forEach((destLabel: string | string[], symbol: string) => {
        const nextState = stateMap.get(destLabel as string);
        if (nextState) {
          state.addNext(symbol, nextState);
        }
      });
    }

    return newStates;
  }

  protected abstract initializeStates(
    graphStates: Set<State>,
  ): [State, State[]];
}
