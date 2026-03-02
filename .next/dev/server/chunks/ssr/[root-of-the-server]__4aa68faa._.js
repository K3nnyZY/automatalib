module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/features/automata/base-automaton.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
    /** The singleton entry-point starting node for evaluation graph parsing */ initial_state;
    /** Internal isolated array preserving accepting final states mapping constraints */ accept_states;
    /** Custom configurations over generic behavior overrides */ config;
    /** Global empty deterministic transition limit character ("ϵ" / "ε") */ empty_symbol;
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
}),
"[project]/src/features/automata/regex.class.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/features/automata/nfa.class.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NFA",
    ()=>NFA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$regex$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/regex.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-ssr] (ecmascript)");
;
;
class NFA extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Automaton"] {
    /** Embedded internal regex compiled instance containing the parsed Syntax Tree */ regexp;
    /**
   * The transition table of the DFA.
   */ transitions;
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
                        const acceptState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"](++label);
                        initialState.addNext(emptySymbol, acceptState);
                        return acceptState;
                    }
                case "text":
                    {
                        const letter = stNode.text;
                        const acceptState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"](++label);
                        initialState.addNext(letter, acceptState);
                        return acceptState;
                    }
                case "or":
                    {
                        const lastStates = [];
                        for (const part of stNode.parts){
                            const nextState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"](++label);
                            initialState.addNext(emptySymbol, nextState);
                            const lastState = generateGraph(part, nextState);
                            lastStates.push(lastState);
                        }
                        const acceptState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"](++label);
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
                        const tempInitialState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"](++label);
                        initialState.addNext(emptySymbol, tempInitialState);
                        const tempAcceptState = generateGraph(stNode.sub, tempInitialState);
                        if (stNode.type === "star" || stNode.type === "plus") {
                            tempAcceptState.addNext(emptySymbol, tempInitialState);
                        }
                        const acceptState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"](++label);
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
        this.regexp = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$regex$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RegExp"](expression, this.empty_symbol);
        const st = this.regexp.syntax_tree;
        const initialState = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"](label);
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
        this.transitions = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TransitionsTable"]();
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
}),
"[project]/src/features/automata/automata.utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/features/automata/dfa.class.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DFA",
    ()=>DFA,
    "StatesTable",
    ()=>StatesTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/automata.utils.ts [app-ssr] (ecmascript)");
;
;
class StatesTable {
    table;
    constructor(){
        this.table = new Set();
    }
    get(states) {
        for (const row of this.table){
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["equalStates"])(row.states, states)) return row;
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
class DFA extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Automaton"] {
    /** Unoptimized underlying NFA component reference graph */ NFA;
    /** Internal grouping states graph mappings generated from algorithm implementations */ states;
    /** Strict 1-to-1 deterministic transitions matrix derived from Subset Construction */ transitions;
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
            const state = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"](entry.label);
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
}),
"[project]/src/features/automata/udfa.class.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "uDFA",
    ()=>uDFA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/nfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/dfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/automata.utils.ts [app-ssr] (ecmascript)");
;
;
;
;
class uDFA extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DFA"] {
    constructor(expression, config){
        super(expression, config);
    }
    build(expression) {
        const subsetConstruction = (nfa)=>{
            const symbols = nfa.regexp.symbols;
            const states = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StatesTable"]();
            const transitions = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TransitionsTable"]();
            const labeler = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LetterGenerator"]();
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
        this.NFA = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NFA"](expression, this.config);
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
}),
"[project]/src/features/automata/mdfa.class.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mDFA",
    ()=>mDFA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/dfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/automata.utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/udfa.class.ts [app-ssr] (ecmascript)");
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
class mDFA extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DFA"] {
    /** Unoptimized underlying DFA resolved initially using Subset Construction */ uDFA;
    /** Internal tracking mapping equivalent state nodes combinations */ equivalent_states;
    /** History preserving replaced state identicals */ identifiables;
    constructor(expression, config){
        super(expression, config);
    }
    build(expression) {
        const udfa = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uDFA"](expression, this.config);
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
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$automata$2e$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["equalStates"])(newStates[i].states, newStates[j].states)) {
                    const newLabel = newStates[i].label;
                    const oldLabel = newStates[j].label;
                    replaceLabel(newLabel, oldLabel);
                    this.identifiables.add(newLabel, oldLabel);
                    newStates.splice(j, 1);
                    j--;
                }
            }
        }
        const mdfaStates = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StatesTable"]();
        mdfaStates.table = new Set(newStates);
        const mdfaTransitions = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TransitionsTable"]();
        mdfaTransitions.table = new Set(newTransitions);
        return [
            mdfaStates,
            mdfaTransitions
        ];
    }
}
}),
"[project]/src/features/automata/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/udfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/nfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$mdfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/mdfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$base$2d$automaton$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/base-automaton.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$dfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/dfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$regex$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/regex.class.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
}),
"[project]/src/config/cytoscape.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cytoscape_layout",
    ()=>cytoscape_layout,
    "cytoscape_styles",
    ()=>cytoscape_styles
]);
const cytoscape_layout = {
    name: "dagre",
    animate: false,
    fits: true,
    padding: 30,
    rankDir: "LR"
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
            "background-color": "#eff6ff",
            "border-color": "#3b82f6",
            "border-width": 2,
            label: "data(id)",
            "text-valign": "center",
            "text-halign": "center",
            color: "#1e3a8a",
            "font-family": "system-ui, -apple-system, sans-serif",
            "font-size": "14px",
            "font-weight": "bold",
            width: 48,
            height: 48,
            "shadow-blur": 10,
            "shadow-color": "#3b82f6",
            "shadow-opacity": 0.2,
            "shadow-offset-y": 4
        }
    },
    {
        selector: "node.accept",
        style: {
            "border-width": 6,
            "border-style": "double",
            "border-color": "#10b981",
            "background-color": "#ecfdf5",
            color: "#064e3b",
            "shadow-color": "#10b981"
        }
    },
    {
        selector: "edge",
        style: {
            width: 2,
            "line-color": "#94a3b8",
            "target-arrow-color": "#94a3b8",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: "#475569",
            "font-family": "system-ui, -apple-system, sans-serif",
            "font-size": "12px",
            "font-weight": "bold",
            "text-background-opacity": 1,
            "text-background-color": "#ffffff",
            "text-background-padding": "4px",
            "text-background-shape": "roundrectangle",
            "text-border-color": "#e2e8f0",
            "text-border-width": 1,
            "text-border-opacity": 1,
            "text-rotation": "autorotate",
            "text-margin-y": -12,
            "arrow-scale": 1.2
        }
    },
    {
        selector: "edge.start",
        style: {
            "source-endpoint": "outside-to-line",
            "target-endpoint": "outside-to-line",
            "source-distance-from-node": 45,
            "target-distance-from-node": 0,
            "source-arrow-shape": "none",
            "line-style": "dashed",
            "line-color": "#3b82f6",
            "target-arrow-color": "#3b82f6"
        }
    }
];
}),
"[project]/src/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$cytoscapejs$2f$dist$2f$react$2d$cytoscape$2e$modern$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-cytoscapejs/dist/react-cytoscape.modern.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cytoscape$2f$dist$2f$cytoscape$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cytoscape/dist/cytoscape.esm.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cytoscape$2d$dagre$2f$cytoscape$2d$dagre$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cytoscape-dagre/cytoscape-dagre.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/features/automata/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$mdfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/mdfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/udfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/automata/nfa.class.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$cytoscape$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/cytoscape.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cytoscape$2f$dist$2f$cytoscape$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].use(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cytoscape$2d$dagre$2f$cytoscape$2d$dagre$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]);
function Home() {
    const [expression, setExpression] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("(a|b)*abb");
    const [machineType, setMachineType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("mDFA");
    const [elements, setElements] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const cyRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const generateAutomaton = ()=>{
        try {
            setError(null);
            let automata;
            if (machineType === "mDFA") automata = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$mdfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mDFA"](expression);
            else if (machineType === "uDFA") automata = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$udfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uDFA"](expression);
            else automata = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$automata$2f$nfa$2e$class$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NFA"](expression);
            const graphElements = automata.cytograph();
            setElements(graphElements);
        } catch (err) {
            setError(err.message || "Failed to parse expression.");
            setElements([]);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        generateAutomaton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Recalculate layout nicely when elements change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (cyRef.current && elements.length > 0) {
            cyRef.current.layout(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$cytoscape$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cytoscape_layout"]).run();
            cyRef.current.fit();
        }
    }, [
        elements
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "flex h-screen w-full flex-col bg-slate-50 text-slate-900",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex flex-col gap-4 border-b border-slate-200 bg-white p-6 shadow-sm z-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-extrabold tracking-tight text-blue-900",
                                children: "Automatalib Visualizer"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-slate-500 mt-1",
                                children: "Generate and visualize Logic Graphs from Regular Expressions."
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-end gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-1 flex-1 min-w-[300px]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs font-semibold text-slate-600 uppercase tracking-wider",
                                        children: "Regular Expression"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 66,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: expression,
                                        onChange: (e)=>setExpression(e.target.value),
                                        onKeyDown: (e)=>e.key === "Enter" && generateAutomaton(),
                                        className: "rounded-lg border border-slate-300 bg-slate-50 p-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
                                        placeholder: "e.g. (a|b)*abb"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 69,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-1 w-[200px]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs font-semibold text-slate-600 uppercase tracking-wider",
                                        children: "Automaton Type"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 80,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: machineType,
                                        onChange: (e)=>setMachineType(e.target.value),
                                        className: "rounded-lg border border-slate-300 bg-slate-50 p-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "mDFA",
                                                children: "mDFA (Minimized)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 88,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "uDFA",
                                                children: "uDFA (Subset)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 89,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "NFA",
                                                children: "NFA (Thompson)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 90,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 83,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: generateAutomaton,
                                className: "rounded-lg bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-md transition-colors hover:bg-blue-700 active:bg-blue-800",
                                children: "Generate"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-2 rounded-md bg-red-50 p-3 border border-red-200 text-red-700 font-medium text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 103,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative flex-1 bg-slate-100 overflow-hidden",
                children: elements.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$cytoscapejs$2f$dist$2f$react$2d$cytoscape$2e$modern$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    elements: elements,
                    layout: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$cytoscape$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cytoscape_layout"],
                    stylesheet: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$cytoscape$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cytoscape_styles"],
                    style: {
                        width: "100%",
                        height: "100%"
                    },
                    cy: (cy)=>{
                        cyRef.current = cy;
                    }
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 112,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex h-full w-full items-center justify-center text-slate-400",
                    children: error ? "Fix the expression to see the graph." : "No graph to display."
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 122,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4aa68faa._.js.map