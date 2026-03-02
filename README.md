<div align="center">
  <h1>🚀 Automatalib</h1>
  <p><strong>A lightweight, production-ready Finite State Automata Engine for TypeScript.</strong></p>
  
  <p>
    <a href="https://www.npmjs.com/package/automatalib" target="_blank">
        <img src="https://img.shields.io/npm/v/automatalib?color=blue&style=flat-square" alt="NPM Version" />
    </a>
    <a href="https://github.com/K3nnyZY/automatalib/blob/main/LICENSE" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" />
    </a>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" />
  </p>
</div>

---

**Automatalib** is a highly optimized engine that parses, compiles, and evaluates **Regular Expressions** by translating them natively into underlying computer science mathematical structures: Non-Deterministic Finite Automata (**NFA**) and Deterministic Finite Automata (**DFA**).

## 🌟 Key Features

- **Blazing Fast RegExp Parsing:** Compiles Regex strings down to an Abstract Syntax Tree (AST).
- **Multiple Graph Types:** Native support for `NFA`, `uDFA` (Subset Construction), and `mDFA` (Minimized DFA).
- **TypeScript First:** 100% written in TS with rigorous generics, interfaces, and exhaustive TSDoc comments.
- **Visualizer Ready:** Includes a `.cytograph()` method out-of-the-box that exports nodes and edges directly formatted for [Cytoscape.js](https://js.cytoscape.org/).
- **Zero Dependencies:** Keeps your bundle size microscopic. Not a single external dependency used in the core logic.

---

## 📦 Installation

Install via your preferred package manager:

```bash
npm install automatalib
# or
yarn add automatalib
# or
pnpm install automatalib
```

---

## 🚀 Quick Start

Creating an optimized state machine from a Regular Expression takes only 2 lines of code.

```typescript
import { mDFA } from 'automatalib';

// 1. Compile your regex into a Minimized Deterministic Finite Automaton
const pattern = "(a|b)*abb";
const machine = new mDFA(pattern);

// 2. Test input strings against the logic grid
const result1 = machine.test("ababb");
console.log(result1.accept); // true ✅

const result2 = machine.test("aba");
console.log(result2.accept); // false ❌
```

---

## 🧠 Architecture Overview

Automatalib provides three primary computation engines depending on your execution environment priorities. All of them expose the identical `Automaton` abstract methods.

### 1. `NFA` (Thompson's Construction)
The fastest to compile but slowest to execute. It generates a graph with multiple equivalent paths and utilizes `ε` (epsilon/empty) transitions.
```typescript
import { NFA } from 'automatalib';
const nfa = new NFA("(0|1)*00");
```

### 2. `uDFA` (Unoptimized DFA)
Uses the Power-Set (Subset) Construction mathematical algorithm to eliminate all non-determinism (`ε`-transitions) from the underlying NFA, guaranteeing a single exact path per character.
```typescript
import { uDFA } from 'automatalib';
const udfa = new uDFA("(0|1)*00");
```

### 3. `mDFA` (Minimized DFA)
The gold standard for production runtime. It takes the `uDFA` and applies Hopcroft's equivalence grouping to merge identical nodes, producing the absolute smallest number of states mathematically possible to evaluate your expression.
```typescript
import { mDFA } from 'automatalib';
const mdfa = new mDFA("(0|1)*00");
```

---

## 📊 Graph Visualization (Cytoscape Integration)

Every Automaton calculates its own nodal geometry logic automatically. You can export these states directly into Cytoscape arrays or JSON grids to build beautiful UI Dashboards.

```typescript
import { mDFA } from 'automatalib';

const machine = new mDFA("a(b|c)*");

// Returns an array of Edge and Node objects natively typed for Cytoscape.js
const graphElements = machine.cytograph();

console.log(graphElements);
/*
[
  { data: { id: "0", label: "0" }, classes: "start" },
  { data: { id: "1", label: "1" }, classes: "accept" },
  { data: { source: "0", target: "1", label: "a" } },
  ...
]
*/
```

---

## 🛠️ API Reference

### `test(input: string): TestResult`
The primary method execution runtime. Traversing the initialized states following valid arc-edge strings paths.

**Returns:**
```typescript
type TestResult = {
  accept: boolean;   // Whether the machine ended in a successful state
  routes: Route[];   // Debug payload history displaying transitions taken
}
```

### `AutomatonConfig` Option
You can configure the global empty generic transition threshold:
```typescript
const machine = new uDFA("a*", { empty_symbol: "ε" }); // Default is "ϵ"
```

## 🤝 Contributing
Contributions, issues and feature requests are welcome! Feel free to check the [issues page](https://github.com/K3nnyZY/automatalib/issues).

## 📝 License
This project is licensed under the [MIT License](LICENSE).
