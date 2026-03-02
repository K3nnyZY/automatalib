# 🌀 Automata Simulator

**Automata Simulator** is a modern, interactive web application built with [React](https://react.org/), [Next.js](https://nextjs.org/), and [Cytoscape.js](https://js.cytoscape.org/) that dynamically generates graphical Finite Automata representations from Regular Expressions. 

Engineered for reliability and aesthetics, it delivers a sleek interface to evaluate testing strings against deterministic and non-deterministic machines, equipped with dynamic, sequential step-by-step path tracing animations.

## ✨ Features

- **Instant Regex Parsing**: Type any Regular Expression (e.g. `(a|b)*abb`) and instantly watch an interactive state-transition graph build itself.
- **Multiple Machine Computations**: Seamlessly toggle between:
  - **NFA** (Nondeterministic Finite Automata)
  - **uDFA** (Unoptimized Deterministic Finite Automata)
  - **mDFA** (Minimized Deterministic Finite Automata)
- **Interactive Graph Canvas**: Drag, drop, and explore auto-arranged states using the `dagre` layout engine.
- **Live Path Tracing**: Test input strings and watch the simulator concurrently animate every evaluated state transition (Node → Edge → Node) in real-time.
- **Visual Path Validations**: Handles non-deterministic branching gracefully by recording and rendering all possible evaluated paths, coloring **Accepted** routes in Emerald Green and **Rejected** routes in Rose Red.
- **State Transition Tables**: Auto-generates mathematical state transition tables corresponding to your active Regex alphabet, mapping symbols to states.

## 🚀 Getting Started

Ensure you have Node.js installed. Follow these steps to spin up the local development server:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Application**
   ```bash
   npm run dev
   ```

3. **Open the App**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (React 19, TypeScript)
- **Styling**: Tailwind CSS 
- **Graph Visualization**: [Cytoscape.js](https://js.cytoscape.org/) & `cytoscape-dagre`
- **Icons**: Lucide React

## 💡 How to Use
1. Enter your Regular Expression logic in the top navigation bar.
2. Select your required state machine precision (`NFA`, `uDFA` or `mDFA`) from the right-hand panel.
3. Observe the transition table populate all unique symbols `Σ` mathematically.
4. Input a test string (or leave blank) in the test footer, click **Test**, and view the evaluation.
5. Click on any evaluated route inside the "Paths Evaluated" panel to watch the simulated laser trace exactly where your word travelled across the DAG layout!

## 📜 License
This project is open-source and available under the MIT License.
