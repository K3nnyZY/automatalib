export const cytoscape_layout = {
    name: "dagre",
    rankDir: "LR", // Left to Right
    nodeSep: 60,
    edgeSep: 30,
    rankSep: 80,
    padding: 30,
};

export const cytoscape_styles = [
    {
        selector: "node.invisible",
        style: {
            opacity: 0,
            label: "",
        },
    },
    {
        selector: "node",
        style: {
            "background-color": "#ffffff",
            "border-color": "#475569", // Slate-600
            "border-width": 1.5,
            label: "data(id)",
            "text-valign": "center",
            "text-halign": "center",
            color: "#0f172a", // Slate-900
            "font-family": "system-ui, -apple-system, sans-serif",
            "font-size": "13px",
            "font-weight": "500",
            width: 40,
            height: 40,
        },
    },
    {
        selector: "node.accept",
        style: {
            "border-width": 5,
            "border-style": "double",
            "border-color": "#475569",
        },
    },
    {
        selector: "edge",
        style: {
            width: 1.5,
            "line-color": "#64748b", // Slate-500
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: "#334155", // Slate-700
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
            "arrow-scale": 1,
        },
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
            "text-margin-y": -10,
        },
    },
];
