import { State, TransitionsTable } from "./base-automaton";
import { NFA } from "./nfa.class";
import { DFA, StatesTable } from "./dfa.class";
import { LetterGenerator } from "./automata.utils";
import type { AutomatonConfig, StateD } from "@/types/automata";

/**
 * Unoptimized Deterministic Finite Automaton. 
 * Formed from an underlying NFA applying the canonical Subset Construction (Powerset construction) algorithm.
 */
export class uDFA extends DFA {
  constructor(expression: string, config?: AutomatonConfig) {
    super(expression, config);
  }

  protected build(expression: string): [State, State[]] {
    const subsetConstruction = (nfa: NFA): [StatesTable, TransitionsTable] => {
      const symbols = nfa.regexp.symbols;
      const states = new StatesTable();
      const transitions = new TransitionsTable();
      const labeler = new LetterGenerator();

      const initialLabel = labeler.next();
      states.add(initialLabel, nfa.enclosure(nfa.initial_state));

      while (true) {
        const tEntry: StateD | null = states.getUnmarked();
        if (!tEntry) break;

        tEntry.marked = true;
        const T = tEntry.states;
        const tLabel = tEntry.label;

        for (const symbol of symbols) {
          const U = nfa.enclosure(nfa.move(T, symbol));

          if (U.length === 0) {
            continue;
          }

          let uEntry = states.get(U);
          let uLabel: string;

          if (!uEntry) {
            uLabel = labeler.next();
            states.add(uLabel, U);
          } else {
            uLabel = uEntry.label;
          }

          transitions.add(tLabel, symbol, uLabel);
        }
      }

      return [states, transitions];
    };

    this.NFA = new NFA(expression, this.config);
    [this.states, this.transitions] = subsetConstruction(this.NFA);

    const graphStates = this.generateGraph();
    return this.initializeStates(graphStates);
  }

  protected initializeStates(graphStates: Set<State>): [State, State[]] {
    const initialState = (() => {
      for (const entry of this.states.table) {
        for (const state of entry.states) {
          if (state.label === this.NFA.initial_state.label) {
            return this.lookUp(entry.label, graphStates) as State;
          }
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
}
