export const cytoscape_layout = {
    name: "dagre",
    animate: false,
    fits: true,
    padding: 30,
    rankDir: "LR",
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
            "background-color": "#eff6ff", // Tailwind blue-50
            "border-color": "#3b82f6",     // Tailwind blue-500
            "border-width": 2,
            label: "data(id)",
            "text-valign": "center",
            "text-halign": "center",
            color: "#1e3a8a",              // Tailwind blue-900
            "font-family": "system-ui, -apple-system, sans-serif",
            "font-size": "14px",
            "font-weight": "bold",
            width: 48,
            height: 48,
            "shadow-blur": 10,
            "shadow-color": "#3b82f6",
            "shadow-opacity": 0.2,
            "shadow-offset-y": 4,
        },
    },
    {
        selector: "node.accept",
        style: {
            "border-width": 6,
            "border-style": "double",
            "border-color": "#10b981",     // Tailwind emerald-500
            "background-color": "#ecfdf5", // Tailwind emerald-50
            color: "#064e3b",              // Tailwind emerald-900
            "shadow-color": "#10b981",
        },
    },
    {
        selector: "edge",
        style: {
            width: 2,
            "line-color": "#94a3b8",       // Tailwind slate-400
            "target-arrow-color": "#94a3b8",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: "#475569",              // Tailwind slate-600
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
            "arrow-scale": 1.2,
        },
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
            "target-arrow-color": "#3b82f6",
        },
    },
];
