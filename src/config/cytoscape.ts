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
            "border-color": "#9ca3af", // gray-400
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
            "border-color": "#9ca3af",
        },
    },
    {
        selector: "edge",
        style: {
            width: 1.5,
            "line-color": "#000000", // Black
            "target-arrow-color": "#000000",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: "#334155", // Slate-700
            "font-family": "system-ui, -apple-system, sans-serif",
            "font-size": "9px",
            "font-weight": "600",
            "text-background-opacity": 0,
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
            "line-color": "#000000",
            "target-arrow-color": "#000000",
            label: "start",
            "text-margin-x": -30,
            "text-margin-y": -10,
        },
    },
    {
        selector: "node.highlighted-success",
        style: {
            "background-color": "#ecfdf5", // emerald-50
            "border-color": "#10b981", // emerald-500
            "color": "#047857", // emerald-700
            "border-width": 3,
            "box-shadow": "0 0 10px #34d399",
        },
    },
    {
        selector: "edge.highlighted-success",
        style: {
            "line-color": "#10b981", // emerald-500
            "target-arrow-color": "#10b981", // emerald-500
            "width": 3,
        },
    },
    {
        selector: "node.highlighted-error",
        style: {
            "background-color": "#fff1f2", // rose-50
            "border-color": "#e11d48", // rose-600
            "color": "#be123c", // rose-700
            "border-width": 3,
            "box-shadow": "0 0 10px #fb7185",
        },
    },
    {
        selector: "edge.highlighted-error",
        style: {
            "line-color": "#e11d48", // rose-600
            "target-arrow-color": "#e11d48", // rose-600
            "width": 3,
        },
    },
];
