"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { Send, Download, Play } from "lucide-react";

import { mDFA, uDFA, NFA } from "@/features/automata";
import { cytoscape_layout, cytoscape_styles } from "@/config/cytoscape";

cytoscape.use(dagre);

export default function Home() {
    const [expression, setExpression] = useState("(a|b)*abb");
    const [machineType, setMachineType] = useState<"mDFA" | "uDFA" | "NFA">("NFA");
    const [automaton, setAutomaton] = useState<mDFA | uDFA | NFA | null>(null);
    const [elements, setElements] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [testString, setTestString] = useState("");
    const [testResult, setTestResult] = useState<boolean | null>(null);

    const cyRef = useRef<cytoscape.Core | null>(null);

    const generateAutomaton = () => {
        try {
            setError(null);
            setTestResult(null);
            let instance;

            if (machineType === "mDFA") instance = new mDFA(expression);
            else if (machineType === "uDFA") instance = new uDFA(expression);
            else instance = new NFA(expression);

            setAutomaton(instance);
            setElements(instance.cytograph());
        } catch (err: any) {
            setError(err.message || "Failed to parse expression.");
            setElements([]);
            setAutomaton(null);
        }
    };

    useEffect(() => {
        generateAutomaton();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (cyRef.current && elements.length > 0) {
            cyRef.current.layout(cytoscape_layout).run();
            cyRef.current.fit();
            cyRef.current.center();
        }
    }, [elements]);

    const testInputString = () => {
        if (!automaton) return;
        try {
            const result = automaton.test(testString);
            setTestResult(result.accept);
        } catch (e: any) {
            setError(e.message);
            setTestResult(null);
        }
    };

    // Extract Symbols mapping
    const symbols = useMemo(() => {
        if (!automaton) return [];
        if ("regexp" in automaton) return Array.from((automaton as NFA).regexp.symbols || []);
        if ("uDFA" in automaton) return Array.from((automaton as mDFA).uDFA.NFA.regexp.symbols || []);
        if ("NFA" in automaton) return Array.from((automaton as uDFA).NFA.regexp.symbols || []);
        return [];
    }, [automaton]);

    // Extract States and Transitions Data
    const transitionsData = useMemo(() => {
        if (!automaton || !automaton.transitions) return [];
        const emptySymbol = (automaton as any).empty_symbol || "ϵ";
        const data: any[] = [];

        // NFA has duplicate keys in its Map tracking natively via string[]. 
        // uDFA/mDFA has single targets. We need to normalize row iteration.
        Array.from(automaton.transitions.table).forEach((row: any) => {
            const rowData: Record<string, string> = { state: row.label };

            symbols.forEach((sym) => {
                const dest = row.transitions.get(sym);
                rowData[sym] = dest ? (Array.isArray(dest) ? `{${dest.join(", ")}}` : dest) : "-";
            });

            if (machineType === "NFA") {
                const emptyDest = row.transitions.get(emptySymbol);
                rowData["empty"] = emptyDest ? (Array.isArray(emptyDest) ? `{${emptyDest.join(", ")}}` : emptyDest) : "-";
            }

            data.push(rowData);
        });

        return data;
    }, [automaton, symbols, machineType]);

    const getMachineName = () => {
        if (machineType === "NFA") return "Nondeterministic Finite Automaton (NFA)";
        if (machineType === "uDFA") return "Unoptimized Deterministic Finite Automaton (uDFA)";
        return "Minimized Deterministic Finite Automaton (mDFA)";
    };

    const getRowPrefix = (label: string) => {
        if (!automaton) return "";
        const isStart = label === automaton.initial_state?.label.toString();
        const isAccept = automaton.accept_states?.some(s => s.label.toString() === label);

        let prefix = "";
        if (isStart) prefix += "→ ";
        if (isAccept) prefix += "* ";
        return prefix;
    };

    return (
        <div className="flex h-screen w-full flex-col bg-slate-50 font-sans text-slate-900 border-t-8 border-slate-900">
            {/* Top Navbar */}
            <nav className="flex items-center justify-center p-4 border-b border-slate-200 bg-slate-100/50">
                <div className="relative w-full max-w-2xl flex items-center">
                    <input
                        type="text"
                        className="w-full rounded-md border border-slate-200 px-4 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-slate-800"
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && generateAutomaton()}
                        placeholder="Regex, e.g. (a|b)*abb"
                    />
                    <button
                        onClick={generateAutomaton}
                        className="absolute right-2 p-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar Table */}
                <aside className="w-1/4 min-w-[300px] border-r border-slate-200 overflow-y-auto bg-white p-6">
                    <div className="flex flex-col items-center mb-8">
                        <h2 className="text-xl font-bold tracking-tight">Symbols</h2>
                        <p className="text-sm text-slate-600 font-mono mt-1">Σ = {"{"}{symbols.join(", ")}{"}"}</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <h2 className="text-xl font-bold tracking-tight mb-4">Transitions</h2>
                        {transitionsData.length > 0 ? (
                            <table className="w-full text-center text-sm">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 text-slate-500">
                                        <th className="font-semibold py-2">State</th>
                                        {symbols.map(sym => (
                                            <th key={sym} className="font-semibold py-2">{sym}</th>
                                        ))}
                                        {machineType === "NFA" && <th className="font-semibold py-2">ε</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {transitionsData.map((row) => (
                                        <tr key={row.state} className="border-b border-slate-100 hover:bg-slate-50/80">
                                            <td className="py-2.5 font-mono text-slate-700 font-medium">
                                                <span className="w-6 inline-block text-left text-slate-400 font-bold">{getRowPrefix(row.state)}</span>
                                                {row.state}
                                            </td>
                                            {symbols.map(sym => (
                                                <td key={sym} className="py-2.5 font-mono text-slate-600">{row[sym]}</td>
                                            ))}
                                            {machineType === "NFA" && (
                                                <td className="py-2.5 font-mono text-slate-600">{row["empty"]}</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-xs text-slate-400">No transitions plotted.</p>
                        )}
                    </div>
                </aside>

                {/* Right Canvas Area */}
                <main className="flex-1 flex flex-col relative p-4 bg-slate-50">

                    {/* Dropdown Type Selector */}
                    <div className="w-full bg-white border border-slate-200 rounded-md shadow-sm mb-4">
                        <select
                            className="w-full py-2.5 px-4 text-sm outline-none appearance-none"
                            value={machineType}
                            onChange={(e) => {
                                setMachineType(e.target.value as any);
                                setTimeout(generateAutomaton, 10);
                            }}
                        >
                            <option value="NFA">Nondeterministic Finite Automaton (NFA)</option>
                            <option value="uDFA">Unoptimized Deterministic Finite Automaton (uDFA)</option>
                            <option value="mDFA">Minimized Deterministic Finite Automaton (mDFA)</option>
                        </select>
                    </div>

                    {/* Graph Canvas */}
                    <div className="flex-1 bg-slate-100/50 rounded-md border border-slate-200 relative overflow-hidden">

                        {/* Download Button overlay */}
                        <button className="absolute top-4 right-4 z-10 p-2 rounded-md bg-slate-900 text-white shadow-md hover:bg-slate-800">
                            <Download size={18} />
                        </button>

                        {error ? (
                            <div className="flex w-full h-full items-center justify-center text-red-500 font-medium text-sm">
                                {error}
                            </div>
                        ) : elements.length > 0 ? (
                            <CytoscapeComponent
                                elements={elements}
                                layout={cytoscape_layout}
                                stylesheet={cytoscape_styles as any}
                                style={{ width: "100%", height: "100%" }}
                                cy={(cy) => { cyRef.current = cy; }}
                            />
                        ) : (
                            <div className="flex w-full h-full items-center justify-center text-slate-300">
                                Awaiting Graph Payload...
                            </div>
                        )}

                        <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
                            <p className="text-[11px] text-slate-400">
                                In some cases, the edges may overlap. To fix this, just drag and drop the nodes until you see all of the edges.
                            </p>
                        </div>
                    </div>

                    {/* Footer Tester */}
                    <div className="mt-4 flex gap-2">
                        <input
                            type="text"
                            value={testString}
                            onChange={(e) => setTestString(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && testInputString()}
                            placeholder="Enter a string to test with the automaton or leave blank to enter an empty string..."
                            className="flex-1 rounded border border-slate-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:border-slate-400"
                        />
                        <button
                            onClick={testInputString}
                            className="bg-slate-900 text-white px-6 py-2 rounded text-sm font-medium hover:bg-slate-800 flex items-center gap-2"
                        >
                            Test
                        </button>
                    </div>

                    {testResult !== null && (
                        <div className={`mt-2 text-sm font-medium px-2 ${testResult ? "text-green-600" : "text-red-500"}`}>
                            {testResult ? `✓ Accepted: "${testString}" belongs to the language.` : `✕ Rejected: "${testString}" is invalid.`}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
