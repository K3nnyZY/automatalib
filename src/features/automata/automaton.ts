import type { TestResult, Route, Transition, TransitionD, AutomatonConfig } from "@/types/automata";

export class State {
  public label: number | string;
  public next: Edge[];
  public accept: boolean = false;

  constructor(label: number | string) {
    this.label = label;
    this.next = [];
  }

  public addNext(symbol: string, state: State): void {
    this.next.push(new Edge(symbol, state));
  }
}

class Edge {
  public symbol: string;
  public to: State;

  constructor(symbol: string, to: State) {
    this.symbol = symbol;
    this.to = to;
  }
}

export class TransitionsTable {
  public table: Set<TransitionD>;

  constructor() {
    this.table = new Set();
  }

  public get(label: string): TransitionD | null {
    for (const row of this.table) {
      if (row.label === label) return row;
    }
    return null;
  }

  public add(
    fromLabel: string,
    symbol?: string,
    toLabel?: string,
    emptySymbol?: string,
  ): void {
    let entry = this.get(fromLabel);

    if (!entry) {
      entry = { label: fromLabel, transitions: new Map() };
      this.table.add(entry);
    }

    if (symbol && toLabel) {
      if (emptySymbol && symbol === emptySymbol) {
        if (!entry.transitions.has(symbol)) {
          entry.transitions.set(symbol, []);
        }
        (entry.transitions.get(symbol) as string[]).push(toLabel);
      } else {
        entry.transitions.set(symbol, toLabel);
      }
    }
  }

  public clone(): TransitionsTable {
    const newTable = new TransitionsTable();

    for (const entry of this.table) {
      newTable.table.add({
        label: entry.label,
        transitions: new Map(entry.transitions),
      });
    }

    return newTable;
  }
}

export abstract class Automaton {
  public initial_state!: State;
  public accept_states!: State[];
  protected config?: AutomatonConfig;
  protected empty_symbol!: string;

  constructor(data: string, config?: AutomatonConfig) {
    this.config = config;
    this.empty_symbol = config?.empty_symbol ?? "ϵ";

    const [initialState, acceptStates] = this.build(data);
    this.initial_state = initialState;
    this.accept_states = acceptStates;

    this.accept_states.forEach((state) => (state.accept = true));
  }

  protected abstract build(data: string): [State, State[]];

  public cytograph(): object[] {
    const visited = new Set<State>();
    const states: object[] = [];
    const edges: object[] = [];

    const dfs = (state: State) => {
      if (visited.has(state)) return;
      visited.add(state);

      states.push({
        data: { id: state.label.toString(), label: state.label.toString() },
        classes: state.accept ? "accept" : "",
      });

      for (const edge of state.next) {
        edges.push({
          data: {
            source: state.label.toString(),
            target: edge.to.label.toString(),
            label: edge.symbol,
          },
        });
        dfs(edge.to);
      }
    };

    states.push({ data: { id: "invisible", label: "" }, classes: "invisible" });
    states.push({
      data: {
        id: "start",
        source: "invisible",
        target: this.initial_state.label.toString(),
        label: "start",
      },
      classes: "start",
    });

    dfs(this.initial_state);

    return [...states, ...edges];
  }

  public move(states: State | State[], symbol: string): State[] {
    const reachableStates = new Set<State>();
    const statesArray = Array.isArray(states) ? states : [states];

    for (const state of statesArray) {
      for (const edge of state.next) {
        if (edge.symbol === symbol) {
          reachableStates.add(edge.to);
        }
      }
    }

    return Array.from(reachableStates);
  }

  public test(input: string): TestResult {
    const emptySymbol = this.empty_symbol;

    if (input.includes(emptySymbol)) {
      throw new Error(`String cannot contain empty character limit '${emptySymbol}'.`);
    }

    const rejectedSymbols = ['(', ')', '|', '+', '*'];
    if (rejectedSymbols.some((sym) => input.includes(sym))) {
      throw new Error(`String cannot contain: ${rejectedSymbols.join(', ')}.`);
    }

    const result: TestResult = { accept: false, routes: [] };

    const traverse = (
      state: State,
      subStr: string,
      route: Route = { valid: false, transitions: [] },
    ): void => {
      const transition: Transition = { from: state };
      route.transitions.push(transition);

      let deadEnd = true;

      for (const edge of state.next) {
        if (edge.symbol === subStr[0] || edge.symbol === emptySymbol) {
          deadEnd = false;
          transition.symbol = edge.symbol;

          const newSubStr = edge.symbol === emptySymbol ? subStr : subStr.slice(1);
          const newRoute: Route = {
            valid: route.valid,
            transitions: [...route.transitions],
          };

          traverse(edge.to, newSubStr, newRoute);
        }
      }

      if (deadEnd) {
        result.routes.push(route);
        if (state.accept && subStr.length === 0) {
          route.valid = true;
          result.accept = true;
        }
      }
    };

    traverse(this.initial_state, input);

    return result;
  }
}

