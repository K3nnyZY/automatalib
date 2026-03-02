"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { Send, Network } from "lucide-react";

import { mDFA, uDFA, NFA } from "@/features/automata";
import { cytoscape_layout, cytoscape_styles } from "@/config/cytoscape";
import type { TestResult } from "@/types/automata";

cytoscape.use(dagre);

export default function Home() {
    const [expression, setExpression] = useState("");
    const [machineType, setMachineType] = useState<"mDFA" | "uDFA" | "NFA">("NFA");
    const [automaton, setAutomaton] = useState<mDFA | uDFA | NFA | null>(null);
    const [elements, setElements] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [testString, setTestString] = useState("");
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);

    const cyRef = useRef<cytoscape.Core | null>(null);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    const generateAutomaton = (overrideType?: "mDFA" | "uDFA" | "NFA") => {
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

            if (targetType === "mDFA") instance = new mDFA(expression);
            else if (targetType === "uDFA") instance = new uDFA(expression);
            else instance = new NFA(expression);

            setAutomaton(instance);
            setElements(instance.cytograph());

            // Clear previous graph highlights when generating a new automaton
            setTimeout(() => {
                cyRef.current?.elements().removeClass("highlighted");
            }, 50);

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
        if (!automaton || !cyRef.current) return;
        try {
            // Clear existing timeouts
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];

            // Reset previous highlights
            cyRef.current.elements().removeClass("highlighted");
            setSelectedRouteIndex(null);

            const result = automaton.test(testString);
            setTestResult(result);

            // We now wait for user interaction to animate a specific route
        } catch (e: any) {
            setError(e.message);
            setTestResult(null);
            cyRef.current?.elements().removeClass("highlighted");
        }
    };

    const animateRoute = (routeIndex: number) => {
        if (!testResult || !cyRef.current) return;

        // Clear existing timeouts
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];

        setSelectedRouteIndex(routeIndex);

        const route = testResult.routes[routeIndex];
        const cy = cyRef.current;

        // Reset previous highlights
        cy.elements().removeClass("highlighted");

        let delay = 0;
        route.transitions.forEach((t, i) => {
            // Highlight Node
            timeoutsRef.current.push(setTimeout(() => {
                cy.elements().removeClass("highlighted"); // clear everything
                cy.$(`#${t.from.label}`).addClass("highlighted"); // mark node
            }, delay));
            delay += 500;

            // Highlight Edge transition
            if (t.symbol !== undefined && i < route.transitions.length - 1) {
                timeoutsRef.current.push(setTimeout(() => {
                    cy.elements().removeClass("highlighted"); // clear node mark
                    const nextNode = route.transitions[i + 1].from.label;
                    cy.edges(`[source = "${t.from.label}"][target = "${nextNode}"][label = "${t.symbol}"]`).addClass("highlighted"); // mark edge
                }, delay));
                delay += 500;
            }
        });

        // Clear absolute status at end
        timeoutsRef.current.push(setTimeout(() => {
            cy.elements().removeClass("highlighted");
        }, delay));
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
        <div className="flex h-screen w-full flex-col bg-slate-50 font-sans text-slate-900">
            {/* Top Navbar */}
            <nav className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-100/50">
                <div className="flex items-center gap-2 font-bold text-lg text-slate-800 tracking-tight ml-4">
                    <div className="bg-slate-900 p-1.5 rounded-md">
                        <Network className="text-white" size={18} />
                    </div>
                    Automata Simulator
                </div>

                <div className="relative w-full max-w-xl flex items-center mr-4">
                    <input
                        type="text"
                        className="w-full rounded-md border border-slate-200 px-4 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-slate-800"
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && generateAutomaton()}
                        placeholder="Regex, e.g. (a|b)*abb"
                    />
                    <button
                        onClick={() => generateAutomaton()}
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
                                const newType = e.target.value as any;
                                setMachineType(newType);
                                setTimeout(() => generateAutomaton(newType), 10);
                            }}
                        >
                            <option value="NFA">Nondeterministic Finite Automaton (NFA)</option>
                            <option value="uDFA">Unoptimized Deterministic Finite Automaton (uDFA)</option>
                            <option value="mDFA">Minimized Deterministic Finite Automaton (mDFA)</option>
                        </select>
                    </div>

                    {/* Graph Canvas */}
                    <div className="flex-1 bg-slate-100/50 rounded-md border border-slate-200 relative overflow-hidden">

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

                    {/* Footer Tester Area */}
                    <div className="h-72 mt-4 flex flex-col gap-2 shrink-0">
                        <div className="flex gap-2">
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
                                className="bg-slate-900 text-white px-6 py-2 rounded text-sm font-medium hover:bg-slate-800 flex items-center gap-2 transition-colors"
                            >
                                Test
                            </button>
                        </div>

                        {/* Static Path Container */}
                        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-md p-3 overflow-y-auto custom-scrollbar flex flex-col">
                            {testResult === null ? (
                                <div className="m-auto text-slate-400 text-sm">Paths evaluated during tests will be listed here.</div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className={`text-sm font-bold flex items-center justify-between px-1 ${testResult.accept ? "text-emerald-600" : "text-red-500"}`}>
                                        <span>{testResult.accept ? `✓ Accepted: "${testString}" belongs to the language.` : `✕ Rejected: "${testString}" is invalid.`}</span>
                                        <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Paths Evaluated ({testResult.routes.length})</span>
                                    </div>

                                    <div className="space-y-2">
                                        {testResult.routes.map((route: any, rIndex: number) => {
                                            const isSelected = selectedRouteIndex === rIndex;
                                            return (
                                                <button
                                                    key={rIndex}
                                                    onClick={() => animateRoute(rIndex)}
                                                    className={`w-full text-left text-xs font-mono p-2.5 rounded border shadow-sm overflow-x-auto whitespace-nowrap transition-all duration-200 
                                                        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:border-blue-400 hover:shadow-md'} 
                                                        ${route.valid ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                                                >
                                                    <span className={`font-bold mr-3 ${route.valid ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                        {route.valid ? '✓ ACCEPTED:' : '✕ REJECTED:'}
                                                    </span>
                                                    {route.transitions.map((t: any, i: number) => (
                                                        <span key={i} className="inline-flex items-center">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded border transition-colors ${i === route.transitions.length - 1 && route.valid
                                                                ? 'bg-emerald-500 border-emerald-600 text-white font-bold shadow-sm'
                                                                : (route.valid ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600')
                                                                }`}>
                                                                {t.from.label}
                                                            </span>
                                                            {t.symbol !== undefined && (
                                                                <span className={`mx-1.5 ${route.valid ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>-{t.symbol}→</span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
