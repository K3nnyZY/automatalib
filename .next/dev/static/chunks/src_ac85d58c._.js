(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/features/automata/base-automaton.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Automaton",
    ()=>Automaton,
    "State",
    ()=>State,
    "TransitionsTable",
    ()=>TransitionsTable
]);
class State {
    /** The unique state label */ label;
    /** Complete edge paths originating from this state */ next;
    /** Mark representing whether traversal up to this state confirms string acceptance */ accept = false;
    constructor(label){
        this.label = label;
        this.next = [];
    }
    addNext(symbol, state) {
        this.next.push(new Edge(symbol, state));
    }
}
/**
 * Inner class tracking directed directional edge symbols from States.
 */ class Edge {
    /** The character input transitioning over the graph edge */ symbol;
    /** The directional pointing target state bound to this step */ to;
    constructor(symbol, to){
        this.symbol = symbol;
        this.to = to;
    }
}
class TransitionsTable {
    table;
    constructor(){
        this.table = new Set();
    }
    get(label) {
        for (const row of this.table){
            if (row.label === label) return row;
        }
        return null;
    }
    add(fromLabel, symbol, toLabel, emptySymbol) {
        let entry = this.get(fromLabel);
        if (!entry) {
            entry = {
                label: fromLabel,
                transitions: new Map()
            };
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
        const newTable = new TransitionsTable();
        for (const entry of this.table){
            newTable.table.add({
                label: entry.label,
                transitions: new Map(entry.transitions)
            });
        }
        return newTable;
    }
}
class Automaton {
    constructor(data, config){
        this.config = config;
        this.empty_symbol = config?.empty_symbol ?? "ϵ";
        const [initialState, acceptStates] = this.build(data);
        this.initial_state = initialState;
        this.accept_states = acceptStates;
        this.accept_states.forEach((state)=>state.accept = true);
    }
    cytograph() {
        const visited = new Set();
        const states = [];
        const edges = [];
        const dfs = (state)=>{
            if (visited.has(state)) return;
            visited.add(state);
            states.push({
                data: {
                    id: state.label.toString(),
                    label: state.label.toString()
                },
                classes: state.accept ? "accept" : ""
            });
            for (const edge of state.next){
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
        states.push({
            data: {
                id: "invisible",
                label: ""
            },
            classes: "invisible"
        });
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
        return [
            ...states,
            ...edges
        ];
    }
    move(states, symbol) {
        const reachableStates = new Set();
        const statesArray = Array.isArray(states) ? states : [
            states
        ];
        for (const state of statesArray){
            for (const edge of state.next){
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
   */ test(input) {
        const emptySymbol = this.empty_symbol;
        if (input.includes(emptySymbol)) {
            throw new Error(`String cannot contain empty character limit '${emptySymbol}'.`);
        }
        const rejectedSymbols = [
            '(',
            ')',
            '|',
            '+',
            '*'
        ];
        if (rejectedSymbols.some((sym)=>input.includes(sym))) {
            throw new Error(`String cannot contain: ${rejectedSymbols.join(', ')}.`);
        }
        const result = {
            accept: false,
            routes: []
        };
        const traverse = (state, subStr, route = {
            valid: false,
            transitions: []
        })=>{
            const transition = {
                from: state
            };
            route.transitions.push(transition);
            let deadEnd = true;
            for (const edge of state.next){
                if (edge.symbol === subStr[0] || edge.symbol === emptySymbol) {
                    deadEnd = false;
                    transition.symbol = edge.symbol;
                    const newSubStr = edge.symbol === emptySymbol ? subStr : subStr.slice(1);
                    const newRoute = {
                        valid: route.valid,
                        transitions: [
                            ...route.transitions
                        ]
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/automata/regex.class.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RegExp",
    ()=>RegExp
]);
class RegExp {
    /** The human-readable source regular expression phrase */ expression;
    /** Mathematical node hierarchical structure evaluated recursively */ syntax_tree;
    /** Extracted uniquely preserved language terminal alphabet character set */ symbols;
    /** Internal epsilon representing empty transitions limits */ empty_symbol;
    constructor(expression, empty_symbol){
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
   */ parse() {
        const emptySymbol = this.empty_symbol;
        const parseSub = (text, begin, end, first)=>{
            let last = 0;
            let stack = 0;
            const node = {
                begin,
                end
            };
            const parts = [];
            let lastOperator = null;
            if (text.length === 0) {
                throw new Error("Empty input");
            }
            if (first) {
                for(let i = 0; i <= text.length; i++){
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
                for(let i = 0; i < text.length; i++){
                    if (text[i] === "(") {
                        last = i + 1;
                        i++;
                        stack = 1;
                        while(i < text.length && stack !== 0){
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
                        parts.push({
                            begin: begin + i,
                            end: begin + i + 1,
                            type: "empty"
                        });
                        lastOperator = null;
                    } else {
                        parts.push({
                            begin: begin + i,
                            end: begin + i + 1,
                            type: "text",
                            text: text[i]
                        });
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
   */ extractSymbols() {
        const ignoreChars = [
            "(",
            ")",
            "|",
            "*",
            "+",
            "?",
            this.empty_symbol
        ];
        //Set to store unique symbols
        const symbolsSet = new Set();
        // Iterate through each character in the regex string
        for (const char of this.expression){
            // Check if the character is not in the ignore list
            if (!ignoreChars.includes(char)) {
                symbolsSet.add(char);
            }
        }
        // Convert the Set to an array and return it
        return Array.from(symbolsSet);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/automata/nfa.class.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NFA",
    ()=>NFA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$regex$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/regex.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-client] (ecmascript)");
;
;
class NFA extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Automaton"] {
    constructor(expression, config){
        super(expression, config);
        this.generateTransitionsTable();
    }
    build(expression) {
        const emptySymbol = this.empty_symbol;
        let label = 0;
        const generateGraph = (stNode, initialState)=>{
            switch(stNode.type){
                case "empty":
                    {
                        const acceptState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["State"](++label);
                        initialState.addNext(emptySymbol, acceptState);
                        return acceptState;
                    }
                case "text":
                    {
                        const letter = stNode.text;
                        const acceptState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["State"](++label);
                        initialState.addNext(letter, acceptState);
                        return acceptState;
                    }
                case "or":
                    {
                        const lastStates = [];
                        for (const part of stNode.parts){
                            const nextState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["State"](++label);
                            initialState.addNext(emptySymbol, nextState);
                            const lastState = generateGraph(part, nextState);
                            lastStates.push(lastState);
                        }
                        const acceptState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["State"](++label);
                        for (const state of lastStates){
                            state.addNext(emptySymbol, acceptState);
                        }
                        return acceptState;
                    }
                case "cat":
                    {
                        let prevState = initialState;
                        for (const part of stNode.parts){
                            prevState = generateGraph(part, prevState);
                        }
                        return prevState;
                    }
                case "star":
                case "plus":
                case "optional":
                    {
                        const tempInitialState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["State"](++label);
                        initialState.addNext(emptySymbol, tempInitialState);
                        const tempAcceptState = generateGraph(stNode.sub, tempInitialState);
                        if (stNode.type === "star" || stNode.type === "plus") {
                            tempAcceptState.addNext(emptySymbol, tempInitialState);
                        }
                        const acceptState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["State"](++label);
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
        this.regexp = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$regex$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RegExp"](expression, this.empty_symbol);
        const st = this.regexp.syntax_tree;
        const initialState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["State"](label);
        const finalState = generateGraph(st, initialState);
        return [
            initialState,
            [
                finalState
            ]
        ];
    }
    /**
   * Enclose the automaton with states. By default, the enclosure is done with empty symbol transitions.
   * @param T - The state or states to be enclosed
   * @param symbol - The symbol to be used for enclosure
   * @returns The set of states reachable from the given states
   */ enclosure(T, symbol = this.empty_symbol) {
        const reacheable_states = new Set();
        // Use depth-first search algorithm
        function DFS(state) {
            if (reacheable_states.has(state)) return;
            reacheable_states.add(state);
            for (const edge of state.next){
                if (edge.symbol == symbol) {
                    DFS(edge.to);
                }
            }
        }
        // Check if T is an array or a single state
        if (Array.isArray(T)) {
            for (const state of T){
                DFS(state);
            }
        } else {
            DFS(T);
        }
        return Array.from(reacheable_states);
    }
    generateTransitionsTable() {
        const empty_symbol = this.empty_symbol;
        this.transitions = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TransitionsTable"]();
        const visited = new Set();
        // Use depth-first search algorithm
        function DFS(transitions, state) {
            if (visited.has(state)) return;
            visited.add(state);
            if (state.next.length == 0) {
                transitions.add(state.label.toString());
            }
            for (const edge of state.next){
                transitions.add(state.label.toString(), edge.symbol, edge.to.label.toString(), empty_symbol);
                DFS(transitions, edge.to);
            }
        }
        DFS(this.transitions, this.initial_state);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/automata/automata.utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LetterGenerator",
    ()=>LetterGenerator,
    "equalStates",
    ()=>equalStates
]);
class LetterGenerator {
    current;
    constructor(initial = "A"){
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
        for(let i = chars.length - 1; i >= 0 && carry; i--){
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
function equalStates(statesA, statesB) {
    if (statesA.length !== statesB.length) return false;
    const labelsA = new Set(statesA.map((s)=>s.label));
    const labelsB = new Set(statesB.map((s)=>s.label));
    if (labelsA.size !== labelsB.size) return false;
    return Array.from(labelsA).every((label)=>labelsB.has(label));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/automata/dfa.class.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DFA",
    ()=>DFA,
    "StatesTable",
    ()=>StatesTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/automata.utils.ts [app-client] (ecmascript)");
;
;
class StatesTable {
    table;
    constructor(){
        this.table = new Set();
    }
    get(states) {
        for (const row of this.table){
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalStates"])(row.states, states)) return row;
        }
        return null;
    }
    add(label, states) {
        this.table.add({
            label,
            states,
            marked: false
        });
    }
    getUnmarked() {
        for (const row of this.table){
            if (!row.marked) return row;
        }
        return null;
    }
    clone() {
        const newTable = new StatesTable();
        for (const entry of this.table){
            newTable.table.add({
                ...entry,
                states: [
                    ...entry.states
                ]
            });
        }
        return newTable;
    }
}
class DFA extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Automaton"] {
    lookUp(label, states) {
        for (const state of states){
            if (state.label === label) return state;
        }
        return null;
    }
    generateGraph() {
        const newStates = new Set();
        const stateMap = new Map();
        for (const entry of this.states.table){
            const state = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["State"](entry.label);
            newStates.add(state);
            stateMap.set(entry.label, state);
        }
        for (const entry of this.transitions.table){
            const state = stateMap.get(entry.label);
            if (!state) continue;
            entry.transitions.forEach((destLabel, symbol)=>{
                const nextState = stateMap.get(destLabel);
                if (nextState) {
                    state.addNext(symbol, nextState);
                }
            });
        }
        return newStates;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/automata/udfa.class.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "uDFA",
    ()=>uDFA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/nfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/dfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/automata.utils.ts [app-client] (ecmascript)");
;
;
;
;
class uDFA extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DFA"] {
    constructor(expression, config){
        super(expression, config);
    }
    build(expression) {
        const subsetConstruction = (nfa)=>{
            const symbols = nfa.regexp.symbols;
            const states = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatesTable"]();
            const transitions = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TransitionsTable"]();
            const labeler = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LetterGenerator"]();
            const initialLabel = labeler.next();
            states.add(initialLabel, nfa.enclosure(nfa.initial_state));
            while(true){
                const tEntry = states.getUnmarked();
                if (!tEntry) break;
                tEntry.marked = true;
                const T = tEntry.states;
                const tLabel = tEntry.label;
                for (const symbol of symbols){
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
            return [
                states,
                transitions
            ];
        };
        this.NFA = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NFA"](expression, this.config);
        [this.states, this.transitions] = subsetConstruction(this.NFA);
        const graphStates = this.generateGraph();
        return this.initializeStates(graphStates);
    }
    initializeStates(graphStates) {
        const initialState = (()=>{
            for (const entry of this.states.table){
                for (const state of entry.states){
                    if (state.label === this.NFA.initial_state.label) {
                        return this.lookUp(entry.label, graphStates);
                    }
                }
            }
            return null;
        })();
        const acceptStates = [];
        for (const entry of this.states.table){
            for (const state of entry.states){
                if (state.label === this.NFA.accept_states[0].label) {
                    const matchedState = this.lookUp(entry.label, graphStates);
                    if (matchedState) acceptStates.push(matchedState);
                }
            }
        }
        return [
            initialState,
            acceptStates
        ];
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/automata/mdfa.class.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mDFA",
    ()=>mDFA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/dfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/automata.utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/udfa.class.ts [app-client] (ecmascript)");
;
;
;
;
/**
 * Internal mapping tracker linking combined identifiers from minimized Equivalent States.
 */ class Identifiables {
    table;
    constructor(){
        this.table = new Map();
    }
    add(label, identical) {
        if (!this.table.has(label)) {
            this.table.set(label, new Set());
        }
        this.table.get(label)?.add(identical);
    }
}
class mDFA extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DFA"] {
    constructor(expression, config){
        super(expression, config);
    }
    build(expression) {
        const udfa = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uDFA"](expression, this.config);
        this.NFA = udfa.NFA;
        this.uDFA = udfa;
        this.equivalent_states = this.equivalentStates(udfa.states);
        [this.states, this.transitions] = this.reduce(this.equivalent_states, udfa.transitions);
        const graphStates = this.generateGraph();
        return this.initializeStates(graphStates);
    }
    initializeStates(graphStates) {
        const initialState = (()=>{
            for (const entry of this.states.table){
                if (entry.label === this.uDFA.initial_state.label) {
                    return this.lookUp(entry.label, graphStates);
                }
            }
            return null;
        })();
        const acceptStates = [];
        for (const entry of this.states.table){
            for (const state of entry.states){
                if (state.label === this.NFA.accept_states[0].label) {
                    const matchedState = this.lookUp(entry.label, graphStates);
                    if (matchedState) acceptStates.push(matchedState);
                }
            }
        }
        return [
            initialState,
            acceptStates
        ];
    }
    equivalentStates(states) {
        const newTable = states.clone();
        const emptySymbol = this.empty_symbol;
        const isSignificant = (state)=>{
            if (state.accept) return true;
            if (state.next.length > 0 && state.next[0].symbol !== emptySymbol) {
                return true;
            }
            return false;
        };
        for (const entry of newTable.table){
            entry.states = entry.states.filter(isSignificant);
        }
        return newTable;
    }
    reduce(equivalentStates, transitions) {
        this.identifiables = new Identifiables();
        let newStates = Array.from(equivalentStates.table);
        const newTransitions = Array.from(transitions.table);
        const replaceLabel = (newLabel, oldLabel)=>{
            for(let i = newTransitions.length - 1; i >= 0; i--){
                if (newTransitions[i].label === oldLabel) {
                    newTransitions.splice(i, 1);
                }
            }
            for (const tD of newTransitions){
                tD.transitions.forEach((dest, symbol)=>{
                    if (dest === oldLabel) {
                        tD.transitions.set(symbol, newLabel);
                    }
                });
            }
        };
        for(let i = 0; i < newStates.length; i++){
            for(let j = i + 1; j < newStates.length; j++){
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalStates"])(newStates[i].states, newStates[j].states)) {
                    const newLabel = newStates[i].label;
                    const oldLabel = newStates[j].label;
                    replaceLabel(newLabel, oldLabel);
                    this.identifiables.add(newLabel, oldLabel);
                    newStates.splice(j, 1);
                    j--;
                }
            }
        }
        const mdfaStates = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatesTable"]();
        mdfaStates.table = new Set(newStates);
        const mdfaTransitions = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TransitionsTable"]();
        mdfaTransitions.table = new Set(newTransitions);
        return [
            mdfaStates,
            mdfaTransitions
        ];
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/automata/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/udfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/nfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$mdfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/mdfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/dfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$regex$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/regex.class.ts [app-client] (ecmascript)");
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/config/cytoscape.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cytoscape_layout",
    ()=>cytoscape_layout,
    "cytoscape_styles",
    ()=>cytoscape_styles
]);
const cytoscape_layout = {
    name: "dagre",
    rankDir: "LR",
    nodeSep: 60,
    edgeSep: 30,
    rankSep: 80,
    padding: 30
};
const cytoscape_styles = [
    {
        selector: "node.invisible",
        style: {
            opacity: 0,
            label: ""
        }
    },
    {
        selector: "node",
        style: {
            "background-color": "#ffffff",
            "border-color": "#475569",
            "border-width": 1.5,
            label: "data(id)",
            "text-valign": "center",
            "text-halign": "center",
            color: "#0f172a",
            "font-family": "system-ui, -apple-system, sans-serif",
            "font-size": "13px",
            "font-weight": "500",
            width: 40,
            height: 40
        }
    },
    {
        selector: "node.accept",
        style: {
            "border-width": 5,
            "border-style": "double",
            "border-color": "#475569"
        }
    },
    {
        selector: "edge",
        style: {
            width: 1.5,
            "line-color": "#64748b",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: "#334155",
            "font-family": "system-ui, -apple-system, sans-serif",
            "font-size": "9px",
            "font-weight": "600",
            "text-background-opacity": 1,
            "text-background-color": "#f8fafc",
            "text-background-padding": "2px",
            "text-background-shape": "roundrectangle",
            "text-border-color": "#e2e8f0",
            "text-border-width": 0.5,
            "text-rotation": "autorotate",
            "text-margin-y": -10,
            "arrow-scale": 1
        }
    },
    {
        selector: "edge.start",
        style: {
            "source-endpoint": "outside-to-line",
            "target-endpoint": "outside-to-line",
            "source-distance-from-node": 35,
            "target-distance-from-node": 0,
            "source-arrow-shape": "none",
            "line-style": "solid",
            "line-color": "#64748b",
            "target-arrow-color": "#64748b",
            label: "start",
            "text-margin-x": -30,
            "text-margin-y": -10
        }
    },
    {
        selector: "node.highlighted",
        style: {
            "background-color": "#eff6ff",
            "border-color": "#3b82f6",
            "color": "#1d4ed8",
            "border-width": 3,
            "box-shadow": "0 0 10px #60a5fa"
        }
    },
    {
        selector: "edge.highlighted",
        style: {
            "line-color": "#3b82f6",
            "target-arrow-color": "#3b82f6",
            "width": 3
        }
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$cytoscapejs$2f$dist$2f$react$2d$cytoscape$2e$modern$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-cytoscapejs/dist/react-cytoscape.modern.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cytoscape$2f$dist$2f$cytoscape$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cytoscape/dist/cytoscape.esm.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cytoscape$2d$dagre$2f$cytoscape$2d$dagre$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cytoscape-dagre/cytoscape-dagre.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.js [app-client] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$network$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Network$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/network.js [app-client] (ecmascript) <export default as Network>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/features/automata/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$mdfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/mdfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/udfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/nfa.class.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$cytoscape$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/cytoscape.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cytoscape$2f$dist$2f$cytoscape$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].use(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cytoscape$2d$dagre$2f$cytoscape$2d$dagre$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]);
function Home() {
    _s();
    const [expression, setExpression] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [machineType, setMachineType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("NFA");
    const [automaton, setAutomaton] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [elements, setElements] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [testString, setTestString] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [testResult, setTestResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const cyRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const generateAutomaton = (overrideType)=>{
        try {
            setError(null);
            setTestResult(null);
            if (!expression.trim()) {
                setAutomaton(null);
                setElements([]);
                return;
            }
            let instance;
            const targetType = overrideType || machineType;
            if (targetType === "mDFA") instance = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$mdfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mDFA"](expression);
            else if (targetType === "uDFA") instance = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uDFA"](expression);
            else instance = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NFA"](expression);
            setAutomaton(instance);
            setElements(instance.cytograph());
            // Clear previous graph highlights when generating a new automaton
            setTimeout(()=>{
                cyRef.current?.elements().removeClass("highlighted");
            }, 50);
        } catch (err) {
            setError(err.message || "Failed to parse expression.");
            setElements([]);
            setAutomaton(null);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            generateAutomaton();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["Home.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            if (cyRef.current && elements.length > 0) {
                cyRef.current.layout(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$cytoscape$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cytoscape_layout"]).run();
                cyRef.current.fit();
                cyRef.current.center();
            }
        }
    }["Home.useEffect"], [
        elements
    ]);
    const testInputString = ()=>{
        if (!automaton || !cyRef.current) return;
        try {
            // Reset previous highlights
            cyRef.current.elements().removeClass("highlighted");
            const result = automaton.test(testString);
            setTestResult(result);
            // Animate Graph Path
            const allRoutes = result.routes;
            if (allRoutes && allRoutes.length > 0) {
                let delay = 0;
                const cy = cyRef.current;
                const maxLength = Math.max(...allRoutes.map((r)=>r.transitions.length));
                for(let i = 0; i < maxLength; i++){
                    setTimeout(()=>{
                        // Clear previous highlights for the 'live' tracing effect
                        cy.elements().removeClass("highlighted");
                        allRoutes.forEach((route)=>{
                            if (i < route.transitions.length) {
                                const t = route.transitions[i];
                                // Highlight Node
                                cy.$(`#${t.from.label}`).addClass("highlighted");
                                // Highlight Edge if not the last node and has a symbol
                                if (t.symbol !== undefined && i < route.transitions.length - 1) {
                                    const nextNode = route.transitions[i + 1].from.label;
                                    cy.edges(`[source = "${t.from.label}"][target = "${nextNode}"][label = "${t.symbol}"]`).addClass("highlighted");
                                }
                            }
                        });
                    }, delay);
                    delay += 500; // 500ms delay per step
                }
                // Clear the absolute final state after the animation finishes
                setTimeout(()=>{
                    cy.elements().removeClass("highlighted");
                }, delay);
            }
        } catch (e) {
            setError(e.message);
            setTestResult(null);
            cyRef.current?.elements().removeClass("highlighted");
        }
    };
    // Extract Symbols mapping
    const symbols = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Home.useMemo[symbols]": ()=>{
            if (!automaton) return [];
            if ("regexp" in automaton) return Array.from(automaton.regexp.symbols || []);
            if ("uDFA" in automaton) return Array.from(automaton.uDFA.NFA.regexp.symbols || []);
            if ("NFA" in automaton) return Array.from(automaton.NFA.regexp.symbols || []);
            return [];
        }
    }["Home.useMemo[symbols]"], [
        automaton
    ]);
    // Extract States and Transitions Data
    const transitionsData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Home.useMemo[transitionsData]": ()=>{
            if (!automaton || !automaton.transitions) return [];
            const emptySymbol = automaton.empty_symbol || "ϵ";
            const data = [];
            // NFA has duplicate keys in its Map tracking natively via string[]. 
            // uDFA/mDFA has single targets. We need to normalize row iteration.
            Array.from(automaton.transitions.table).forEach({
                "Home.useMemo[transitionsData]": (row)=>{
                    const rowData = {
                        state: row.label
                    };
                    symbols.forEach({
                        "Home.useMemo[transitionsData]": (sym)=>{
                            const dest = row.transitions.get(sym);
                            rowData[sym] = dest ? Array.isArray(dest) ? `{${dest.join(", ")}}` : dest : "-";
                        }
                    }["Home.useMemo[transitionsData]"]);
                    if (machineType === "NFA") {
                        const emptyDest = row.transitions.get(emptySymbol);
                        rowData["empty"] = emptyDest ? Array.isArray(emptyDest) ? `{${emptyDest.join(", ")}}` : emptyDest : "-";
                    }
                    data.push(rowData);
                }
            }["Home.useMemo[transitionsData]"]);
            return data;
        }
    }["Home.useMemo[transitionsData]"], [
        automaton,
        symbols,
        machineType
    ]);
    const getMachineName = ()=>{
        if (machineType === "NFA") return "Nondeterministic Finite Automaton (NFA)";
        if (machineType === "uDFA") return "Unoptimized Deterministic Finite Automaton (uDFA)";
        return "Minimized Deterministic Finite Automaton (mDFA)";
    };
    const getRowPrefix = (label)=>{
        if (!automaton) return "";
        const isStart = label === automaton.initial_state?.label.toString();
        const isAccept = automaton.accept_states?.some((s)=>s.label.toString() === label);
        let prefix = "";
        if (isStart) prefix += "→ ";
        if (isAccept) prefix += "* ";
        return prefix;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-screen w-full flex-col bg-slate-50 font-sans text-slate-900",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "flex items-center justify-between p-4 border-b border-slate-200 bg-slate-100/50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 font-bold text-lg text-slate-800 tracking-tight ml-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-slate-900 p-1.5 rounded-md",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$network$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Network$3e$__["Network"], {
                                    className: "text-white",
                                    size: 18
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 185,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 184,
                                columnNumber: 21
                            }, this),
                            "Automata Simulator"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 183,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full max-w-xl flex items-center mr-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                className: "w-full rounded-md border border-slate-200 px-4 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-slate-800",
                                value: expression,
                                onChange: (e)=>setExpression(e.target.value),
                                onKeyDown: (e)=>e.key === "Enter" && generateAutomaton(),
                                placeholder: "Regex, e.g. (a|b)*abb"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 191,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>generateAutomaton(),
                                className: "absolute right-2 p-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 203,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 199,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 190,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 182,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-1 overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "w-1/4 min-w-[300px] border-r border-slate-200 overflow-y-auto bg-white p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center mb-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-xl font-bold tracking-tight",
                                        children: "Symbols"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 214,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-slate-600 font-mono mt-1",
                                        children: [
                                            "Σ = ",
                                            "{",
                                            symbols.join(", "),
                                            "}"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 215,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 213,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-xl font-bold tracking-tight mb-4",
                                        children: "Transitions"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 219,
                                        columnNumber: 25
                                    }, this),
                                    transitionsData.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "w-full text-center text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "border-b-2 border-slate-200 text-slate-500",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "font-semibold py-2",
                                                            children: "State"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 224,
                                                            columnNumber: 41
                                                        }, this),
                                                        symbols.map((sym)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "font-semibold py-2",
                                                                children: sym
                                                            }, sym, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 226,
                                                                columnNumber: 45
                                                            }, this)),
                                                        machineType === "NFA" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "font-semibold py-2",
                                                            children: "ε"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 228,
                                                            columnNumber: 67
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 223,
                                                    columnNumber: 37
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 222,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                children: transitionsData.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "border-b border-slate-100 hover:bg-slate-50/80",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-2.5 font-mono text-slate-700 font-medium",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "w-6 inline-block text-left text-slate-400 font-bold",
                                                                        children: getRowPrefix(row.state)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/page.tsx",
                                                                        lineNumber: 235,
                                                                        columnNumber: 49
                                                                    }, this),
                                                                    row.state
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 234,
                                                                columnNumber: 45
                                                            }, this),
                                                            symbols.map((sym)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2.5 font-mono text-slate-600",
                                                                    children: row[sym]
                                                                }, sym, false, {
                                                                    fileName: "[project]/src/app/page.tsx",
                                                                    lineNumber: 239,
                                                                    columnNumber: 49
                                                                }, this)),
                                                            machineType === "NFA" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-2.5 font-mono text-slate-600",
                                                                children: row["empty"]
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 242,
                                                                columnNumber: 49
                                                            }, this)
                                                        ]
                                                    }, row.state, true, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 233,
                                                        columnNumber: 41
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 231,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 221,
                                        columnNumber: 29
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-slate-400",
                                        children: "No transitions plotted."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 249,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 218,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 212,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 flex flex-col relative p-4 bg-slate-50",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full bg-white border border-slate-200 rounded-md shadow-sm mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "w-full py-2.5 px-4 text-sm outline-none appearance-none",
                                    value: machineType,
                                    onChange: (e)=>{
                                        const newType = e.target.value;
                                        setMachineType(newType);
                                        setTimeout(()=>generateAutomaton(newType), 10);
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "NFA",
                                            children: "Nondeterministic Finite Automaton (NFA)"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 268,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "uDFA",
                                            children: "Unoptimized Deterministic Finite Automaton (uDFA)"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 269,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "mDFA",
                                            children: "Minimized Deterministic Finite Automaton (mDFA)"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 270,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 259,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 258,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 bg-slate-100/50 rounded-md border border-slate-200 relative overflow-hidden",
                                children: [
                                    error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex w-full h-full items-center justify-center text-red-500 font-medium text-sm",
                                        children: error
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 278,
                                        columnNumber: 29
                                    }, this) : elements.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$cytoscapejs$2f$dist$2f$react$2d$cytoscape$2e$modern$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        elements: elements,
                                        layout: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$cytoscape$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cytoscape_layout"],
                                        stylesheet: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$cytoscape$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cytoscape_styles"],
                                        style: {
                                            width: "100%",
                                            height: "100%"
                                        },
                                        cy: (cy)=>{
                                            cyRef.current = cy;
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 282,
                                        columnNumber: 29
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex w-full h-full items-center justify-center text-slate-300",
                                        children: "Awaiting Graph Payload..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 290,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute bottom-4 left-0 w-full text-center pointer-events-none",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[11px] text-slate-400",
                                            children: "In some cases, the edges may overlap. To fix this, just drag and drop the nodes until you see all of the edges."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 296,
                                            columnNumber: 29
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 295,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 275,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: testString,
                                        onChange: (e)=>setTestString(e.target.value),
                                        onKeyDown: (e)=>e.key === "Enter" && testInputString(),
                                        placeholder: "Enter a string to test with the automaton or leave blank to enter an empty string...",
                                        className: "flex-1 rounded border border-slate-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 304,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: testInputString,
                                        className: "bg-slate-900 text-white px-6 py-2 rounded text-sm font-medium hover:bg-slate-800 flex items-center gap-2",
                                        children: "Test"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 312,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 303,
                                columnNumber: 21
                            }, this),
                            testResult !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 flex flex-col gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-sm font-medium px-2 ${testResult.accept ? "text-green-600" : "text-red-500"}`,
                                        children: testResult.accept ? `✓ Accepted: "${testString}" belongs to the language.` : `✕ Rejected: "${testString}" is invalid.`
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 322,
                                        columnNumber: 29
                                    }, this),
                                    testResult.routes.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2",
                                                children: [
                                                    "Paths Evaluated (",
                                                    testResult.routes.length,
                                                    "):"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 329,
                                                columnNumber: 37
                                            }, this),
                                            testResult.routes.map((route, rIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `text-xs font-mono p-2.5 rounded border shadow-sm overflow-x-auto whitespace-nowrap ${route.valid ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 text-slate-500'}`,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `font-bold mr-3 ${route.valid ? 'text-emerald-700' : 'text-slate-400'}`,
                                                            children: route.valid ? '✓ ACCEPTED:' : '✕ REJECTED:'
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 332,
                                                            columnNumber: 45
                                                        }, this),
                                                        route.transitions.map((t, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "inline-flex items-center",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: `inline-block px-1.5 py-0.5 rounded border ${i === route.transitions.length - 1 && route.valid ? 'bg-emerald-500 border-emerald-600 text-white font-bold shadow-sm' : route.valid ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-600'}`,
                                                                        children: t.from.label
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/page.tsx",
                                                                        lineNumber: 337,
                                                                        columnNumber: 53
                                                                    }, this),
                                                                    t.symbol !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: `mx-1.5 ${route.valid ? 'text-emerald-500 font-bold' : 'text-slate-300'}`,
                                                                        children: [
                                                                            "-",
                                                                            t.symbol,
                                                                            "→"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/page.tsx",
                                                                        lineNumber: 344,
                                                                        columnNumber: 57
                                                                    }, this)
                                                                ]
                                                            }, i, true, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 336,
                                                                columnNumber: 49
                                                            }, this))
                                                    ]
                                                }, rIndex, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 331,
                                                    columnNumber: 41
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 328,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 321,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 255,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 209,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 180,
        columnNumber: 9
    }, this);
}
_s(Home, "MMZOa7RiLKymxqSKXzxYlFTmTMw=");
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_ac85d58c._.js.map