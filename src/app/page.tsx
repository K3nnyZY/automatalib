"use client";

import { useState, useEffect, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

import { mDFA, uDFA, NFA } from "@/features/automata";
import { cytoscape_layout, cytoscape_styles } from "@/config/cytoscape";

cytoscape.use(dagre);

export default function Home() {
  const [expression, setExpression] = useState("(a|b)*abb");
  const [machineType, setMachineType] = useState<"mDFA" | "uDFA" | "NFA">("mDFA");
  const [elements, setElements] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cyRef = useRef<cytoscape.Core | null>(null);

  const generateAutomaton = () => {
    try {
      setError(null);
      let automata;

      if (machineType === "mDFA") automata = new mDFA(expression);
      else if (machineType === "uDFA") automata = new uDFA(expression);
      else automata = new NFA(expression);

      const graphElements = automata.cytograph();
      setElements(graphElements);
    } catch (err: any) {
      setError(err.message || "Failed to parse expression.");
      setElements([]);
    }
  };

  useEffect(() => {
    generateAutomaton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate layout nicely when elements change
  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      cyRef.current.layout(cytoscape_layout).run();
      cyRef.current.fit();
    }
  }, [elements]);

  return (
    <main className="flex h-screen w-full flex-col bg-slate-50 text-slate-900">
      {/* Header & Controls Panel */}
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-white p-6 shadow-sm z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-900">
            Automatalib Visualizer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and visualize Logic Graphs from Regular Expressions.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1 flex-1 min-w-[300px]">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Regular Expression
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateAutomaton()}
              className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g. (a|b)*abb"
            />
          </div>

          <div className="flex flex-col gap-1 w-[200px]">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Automaton Type
            </label>
            <select
              value={machineType}
              onChange={(e) => setMachineType(e.target.value as any)}
              className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="mDFA">mDFA (Minimized)</option>
              <option value="uDFA">uDFA (Subset)</option>
              <option value="NFA">NFA (Thompson)</option>
            </select>
          </div>

          <button
            onClick={generateAutomaton}
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-md transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            Generate
          </button>
        </div>

        {error && (
          <div className="mt-2 rounded-md bg-red-50 p-3 border border-red-200 text-red-700 font-medium text-sm">
            {error}
          </div>
        )}
      </header>

      {/* Canvas */}
      <div className="relative flex-1 bg-slate-100 overflow-hidden">
        {elements.length > 0 ? (
          <CytoscapeComponent
            elements={elements}
            layout={cytoscape_layout}
            stylesheet={cytoscape_styles as any}
            style={{ width: "100%", height: "100%" }}
            cy={(cy) => {
              cyRef.current = cy;
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            {error ? "Fix the expression to see the graph." : "No graph to display."}
          </div>
        )}
      </div>
    </main>
  );
}
