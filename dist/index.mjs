// src/features/automata/base-automaton.ts
var State = class {
  /** The unique state label */
  label;
  /** Complete edge paths originating from this state */
  next;
  /** Mark representing whether traversal up to this state confirms string acceptance */
  accept = false;
  constructor(label) {
    this.label = label;
    this.next = [];
  }
  addNext(symbol, state) {
    this.next.push(new Edge(symbol, state));
  }
};
var Edge = class {
  /** The character input transitioning over the graph edge */
  symbol;
  /** The directional pointing target state bound to this step */
  to;
  constructor(symbol, to) {
    this.symbol = symbol;
    this.to = to;
  }
};
var TransitionsTable = class _TransitionsTable {
  table;
  constructor() {
    this.table = /* @__PURE__ */ new Set();
  }
  get(label) {
    for (const row of this.table) {
      if (row.label === label) return row;
    }
    return null;
  }
  add(fromLabel, symbol, toLabel, emptySymbol) {
    let entry = this.get(fromLabel);
    if (!entry) {
      entry = { label: fromLabel, transitions: /* @__PURE__ */ new Map() };
      this.table.add(entry);
    }
    if (symbol && toLabel) {
      if (emptySymbol && symbol === emptySymbol) {
        if (!entry.transitions.has(symbol)) {
          entry.transitions.set(symbol, []);
        }
        entry.transitions.get(symbol).push(toLabel);
      } else {
        entry.transitions.set(symbol, toLabel);
      }
    }
  }
  clone() {
    const newTable = new _TransitionsTable();
    for (const entry of this.table) {
      newTable.table.add({
        label: entry.label,
        transitions: new Map(entry.transitions)
      });
    }
    return newTable;
  }
};
var Automaton = class {
  constructor(data, config) {
    this.config = config;
    this.empty_symbol = config?.empty_symbol ?? "\u03F5";
    const [initialState, acceptStates] = this.build(data);
    this.initial_state = initialState;
    this.accept_states = acceptStates;
    this.accept_states.forEach((state) => state.accept = true);
  }
  cytograph() {
    const visited = /* @__PURE__ */ new Set();
    const states = [];
    const edges = [];
    const dfs = (state) => {
      if (visited.has(state)) return;
      visited.add(state);
      states.push({
        data: { id: state.label.toString(), label: state.label.toString() },
        classes: state.accept ? "accept" : ""
      });
      for (const edge of state.next) {
        edges.push({
          data: {
            source: state.label.toString(),
            target: edge.to.label.toString(),
            label: edge.symbol
          }
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
        label: "start"
      },
      classes: "start"
    });
    dfs(this.initial_state);
    return [...states, ...edges];
  }
  move(states, symbol) {
    const reachableStates = /* @__PURE__ */ new Set();
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
  /**
   * Tests the generic matching runtime compatibility over an explicit string input string.
   * Traversing the initialized states following valid arc-edge strings paths against the internal N/DFA engine.
   *
   * @param input Raw testing phrase evaluating whether it respects automata language sets.
   * @throws Validates string payload length limitations checking rejecting meta-characters constraints.
   * @returns Detailed Test Result payload matching routes status payload
   */
  test(input) {
    const emptySymbol = this.empty_symbol;
    if (input.includes(emptySymbol)) {
      throw new Error(`String cannot contain empty character limit '${emptySymbol}'.`);
    }
    const rejectedSymbols = ["(", ")", "|", "+", "*"];
    if (rejectedSymbols.some((sym) => input.includes(sym))) {
      throw new Error(`String cannot contain: ${rejectedSymbols.join(", ")}.`);
    }
    const result = { accept: false, routes: [] };
    const traverse = (state, subStr, route = { valid: false, transitions: [] }) => {
      const transition = { from: state };
      route.transitions.push(transition);
      let deadEnd = true;
      for (const edge of state.next) {
        if (edge.symbol === subStr[0] || edge.symbol === emptySymbol) {
          deadEnd = false;
          transition.symbol = edge.symbol;
          const newSubStr = edge.symbol === emptySymbol ? subStr : subStr.slice(1);
          const newRoute = {
            valid: route.valid,
            transitions: [...route.transitions]
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
};

// src/features/automata/regex.class.ts
var RegExp = class {
  /** The human-readable source regular expression phrase */
  expression;
  /** Mathematical node hierarchical structure evaluated recursively */
  syntax_tree;
  /** Extracted uniquely preserved language terminal alphabet character set */
  symbols;
  /** Internal epsilon representing empty transitions limits */
  empty_symbol;
  constructor(expression, empty_symbol) {
    this.empty_symbol = empty_symbol;
    this.expression = expression;
    this.syntax_tree = this.parse();
    this.symbols = this.extractSymbols();
  }
  /**
   * Parse a regular expression into a syntax tree.
   *
   * Originally from:
   * https://github.com/CyberZHG/toolbox/blob/gh-pages/js/lexical.js
   *
   * This function was modified for this project.
   @returns The syntax tree of the regular expression
   */
  parse() {
    const emptySymbol = this.empty_symbol;
    const parseSub = (text, begin, end, first) => {
      let last = 0;
      let stack = 0;
      const node = { begin, end };
      const parts = [];
      let lastOperator = null;
      if (text.length === 0) {
        throw new Error("Empty input");
      }
      if (first) {
        for (let i = 0; i <= text.length; i++) {
          if (i === text.length || text[i] === "|" && stack === 0) {
            if (last === 0 && i === text.length) {
              return parseSub(text, begin + last, begin + i, false);
            }
            const sub = parseSub(text.substring(last, i), begin + last, begin + i, true);
            parts.push(sub);
            last = i + 1;
          } else if (text[i] === "(") {
            stack++;
          } else if (text[i] === ")") {
            stack--;
            if (stack < 0) {
              throw new Error(`Unmatched closing parenthesis at position ${i}.`);
            }
          }
        }
        if (parts.length === 1) return parts[0];
        node.type = "or";
        node.parts = parts;
      } else {
        for (let i = 0; i < text.length; i++) {
          if (text[i] === "(") {
            last = i + 1;
            i++;
            stack = 1;
            while (i < text.length && stack !== 0) {
              if (text[i] === "(") stack++;
              else if (text[i] === ")") stack--;
              i++;
            }
            if (stack !== 0) {
              throw new Error(`Missing right bracket for ${begin + last}.`);
            }
            i--;
            const sub = parseSub(text.substring(last, i), begin + last, begin + i, true);
            sub.begin--;
            sub.end++;
            parts.push(sub);
            lastOperator = null;
          } else if (text[i] === "*" || text[i] === "+" || text[i] === "?") {
            if (parts.length === 0) {
              throw new Error(`Unexpected ${text[i]} at ${begin + i}.`);
            }
            const lastPart = parts[parts.length - 1];
            if (lastOperator !== null) {
              if (lastOperator === "?" && text[i] === "?") {
                throw new Error(`Invalid '?' after '?' at ${begin + i}.`);
              }
              if ((text[i] === "*" || text[i] === "+") && (lastOperator === "*" || lastOperator === "+" || lastOperator === "?")) {
                throw new Error(`Invalid '${text[i]}' after '${lastOperator}' at ${begin + i}.`);
              }
            }
            const tempNode = {
              begin: lastPart.begin,
              end: lastPart.end + 1,
              sub: lastPart
            };
            if (text[i] === "*") tempNode.type = "star";
            else if (text[i] === "+") tempNode.type = "plus";
            else tempNode.type = "optional";
            parts[parts.length - 1] = tempNode;
            lastOperator = text[i];
          } else if (text[i] === emptySymbol) {
            parts.push({ begin: begin + i, end: begin + i + 1, type: "empty" });
            lastOperator = null;
          } else {
            parts.push({ begin: begin + i, end: begin + i + 1, type: "text", text: text[i] });
            lastOperator = null;
          }
        }
        if (parts.length === 1) return parts[0];
        node.type = "cat";
        node.parts = parts;
      }
      if (stack > 0) {
        throw new Error(`Unmatched opening parenthesis at position ${end}.`);
      }
      return node;
    };
    return parseSub(this.expression, 0, this.expression.length, true);
  }
  /**
   * Extracts all unique symbols from the regex string.
   * @returns An array of unique symbols.
   */
  extractSymbols() {
    const ignoreChars = ["(", ")", "|", "*", "+", "?", this.empty_symbol];
    const symbolsSet = /* @__PURE__ */ new Set();
    for (const char of this.expression) {
      if (!ignoreChars.includes(char)) {
        symbolsSet.add(char);
      }
    }
    return Array.from(symbolsSet);
  }
};

// src/features/automata/nfa.class.ts
var NFA = class extends Automaton {
  constructor(expression, config) {
    super(expression, config);
    this.generateTransitionsTable();
  }
  build(expression) {
    const emptySymbol = this.empty_symbol;
    let label = 0;
    const generateGraph = (stNode, initialState2) => {
      switch (stNode.type) {
        case "empty": {
          const acceptState = new State(++label);
          initialState2.addNext(emptySymbol, acceptState);
          return acceptState;
        }
        case "text": {
          const letter = stNode.text;
          const acceptState = new State(++label);
          initialState2.addNext(letter, acceptState);
          return acceptState;
        }
        case "or": {
          const lastStates = [];
          for (const part of stNode.parts) {
            const nextState = new State(++label);
            initialState2.addNext(emptySymbol, nextState);
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
          let prevState = initialState2;
          for (const part of stNode.parts) {
            prevState = generateGraph(part, prevState);
          }
          return prevState;
        }
        case "star":
        case "plus":
        case "optional": {
          const tempInitialState = new State(++label);
          initialState2.addNext(emptySymbol, tempInitialState);
          const tempAcceptState = generateGraph(
            stNode.sub,
            tempInitialState
          );
          if (stNode.type === "star" || stNode.type === "plus") {
            tempAcceptState.addNext(emptySymbol, tempInitialState);
          }
          const acceptState = new State(++label);
          tempAcceptState.addNext(emptySymbol, acceptState);
          if (stNode.type === "star" || stNode.type === "optional") {
            initialState2.addNext(emptySymbol, acceptState);
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
  enclosure(T, symbol = this.empty_symbol) {
    const reacheable_states = /* @__PURE__ */ new Set();
    function DFS(state) {
      if (reacheable_states.has(state)) return;
      reacheable_states.add(state);
      for (const edge of state.next) {
        if (edge.symbol == symbol) {
          DFS(edge.to);
        }
      }
    }
    if (Array.isArray(T)) {
      for (const state of T) {
        DFS(state);
      }
    } else {
      DFS(T);
    }
    return Array.from(reacheable_states);
  }
  generateTransitionsTable() {
    const empty_symbol = this.empty_symbol;
    this.transitions = new TransitionsTable();
    const visited = /* @__PURE__ */ new Set();
    function DFS(transitions, state) {
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
          empty_symbol
        );
        DFS(transitions, edge.to);
      }
    }
    DFS(this.transitions, this.initial_state);
  }
};

// src/features/automata/automata.utils.ts
var LetterGenerator = class {
  current;
  constructor(initial = "A") {
    this.current = initial;
  }
  next() {
    const result = this.current;
    this.increment();
    return result;
  }
  increment() {
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
};
function equalStates(statesA, statesB) {
  if (statesA.length !== statesB.length) return false;
  const labelsA = new Set(statesA.map((s) => s.label));
  const labelsB = new Set(statesB.map((s) => s.label));
  if (labelsA.size !== labelsB.size) return false;
  return Array.from(labelsA).every((label) => labelsB.has(label));
}

// src/features/automata/dfa.class.ts
var StatesTable = class _StatesTable {
  table;
  constructor() {
    this.table = /* @__PURE__ */ new Set();
  }
  get(states) {
    for (const row of this.table) {
      if (equalStates(row.states, states)) return row;
    }
    return null;
  }
  add(label, states) {
    this.table.add({ label, states, marked: false });
  }
  getUnmarked() {
    for (const row of this.table) {
      if (!row.marked) return row;
    }
    return null;
  }
  clone() {
    const newTable = new _StatesTable();
    for (const entry of this.table) {
      newTable.table.add({ ...entry, states: [...entry.states] });
    }
    return newTable;
  }
};
var DFA = class extends Automaton {
  lookUp(label, states) {
    for (const state of states) {
      if (state.label === label) return state;
    }
    return null;
  }
  generateGraph() {
    const newStates = /* @__PURE__ */ new Set();
    const stateMap = /* @__PURE__ */ new Map();
    for (const entry of this.states.table) {
      const state = new State(entry.label);
      newStates.add(state);
      stateMap.set(entry.label, state);
    }
    for (const entry of this.transitions.table) {
      const state = stateMap.get(entry.label);
      if (!state) continue;
      entry.transitions.forEach((destLabel, symbol) => {
        const nextState = stateMap.get(destLabel);
        if (nextState) {
          state.addNext(symbol, nextState);
        }
      });
    }
    return newStates;
  }
};

// src/features/automata/udfa.class.ts
var uDFA = class extends DFA {
  constructor(expression, config) {
    super(expression, config);
  }
  build(expression) {
    const subsetConstruction = (nfa) => {
      const symbols = nfa.regexp.symbols;
      const states = new StatesTable();
      const transitions = new TransitionsTable();
      const labeler = new LetterGenerator();
      const initialLabel = labeler.next();
      states.add(initialLabel, nfa.enclosure(nfa.initial_state));
      while (true) {
        const tEntry = states.getUnmarked();
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
          let uLabel;
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
  initializeStates(graphStates) {
    const initialState = (() => {
      for (const entry of this.states.table) {
        for (const state of entry.states) {
          if (state.label === this.NFA.initial_state.label) {
            return this.lookUp(entry.label, graphStates);
          }
        }
      }
      return null;
    })();
    const acceptStates = [];
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
};

// src/features/automata/mdfa.class.ts
var Identifiables = class {
  table;
  constructor() {
    this.table = /* @__PURE__ */ new Map();
  }
  add(label, identical) {
    if (!this.table.has(label)) {
      this.table.set(label, /* @__PURE__ */ new Set());
    }
    this.table.get(label)?.add(identical);
  }
};
var mDFA = class extends DFA {
  constructor(expression, config) {
    super(expression, config);
  }
  build(expression) {
    const udfa = new uDFA(expression, this.config);
    this.NFA = udfa.NFA;
    this.uDFA = udfa;
    this.equivalent_states = this.equivalentStates(udfa.states);
    [this.states, this.transitions] = this.reduce(
      this.equivalent_states,
      udfa.transitions
    );
    const graphStates = this.generateGraph();
    return this.initializeStates(graphStates);
  }
  initializeStates(graphStates) {
    const initialState = (() => {
      for (const entry of this.states.table) {
        if (entry.label === this.uDFA.initial_state.label) {
          return this.lookUp(entry.label, graphStates);
        }
      }
      return null;
    })();
    const acceptStates = [];
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
  equivalentStates(states) {
    const newTable = states.clone();
    const emptySymbol = this.empty_symbol;
    const isSignificant = (state) => {
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
  reduce(equivalentStates, transitions) {
    this.identifiables = new Identifiables();
    let newStates = Array.from(equivalentStates.table);
    const newTransitions = Array.from(transitions.table);
    const replaceLabel = (newLabel, oldLabel) => {
      for (let i = newTransitions.length - 1; i >= 0; i--) {
        if (newTransitions[i].label === oldLabel) {
          newTransitions.splice(i, 1);
        }
      }
      for (const tD of newTransitions) {
        tD.transitions.forEach((dest, symbol) => {
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
};
export {
  Automaton,
  DFA,
  NFA,
  RegExp,
  State,
  StatesTable,
  TransitionsTable,
  mDFA,
  uDFA
};
