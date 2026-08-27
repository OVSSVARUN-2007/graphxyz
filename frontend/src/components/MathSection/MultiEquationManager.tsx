import { Eye, EyeOff, Layers, Plus, Target, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { DimensionMode } from "../../types/graph";

export interface EquationLayer {
    id: string;
    expression: string;
    color: string;
    visible: boolean;
}

interface MultiEquationManagerProps {
    layers: EquationLayer[];
    setLayers: React.Dispatch<React.SetStateAction<EquationLayer[]>>;
    onGenerateMulti: (equations: string[], dimOverride?: DimensionMode) => void;
    isLoading: boolean;
    dimensionMode: DimensionMode;
    setDimensionMode: (dim: DimensionMode) => void;
    intersections?: Array<{ x: number; y: number; equations: string[] }>;
}

const PALETTE = [
    "#38bdf8", // Cyan
    "#ec4899", // Pink
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#a855f7", // Purple
    "#06b6d4", // Turquoise
    "#f43f5e", // Rose
];

export const MultiEquationManager: React.FC<MultiEquationManagerProps> = ({
    layers,
    setLayers,
    onGenerateMulti,
    isLoading,
    dimensionMode,
    setDimensionMode,
    intersections = [],
}) => {
    const [newEqInput, setNewEqInput] = useState<string>("");

    const handleAddLayer = (expr?: string) => {
        const text = expr || newEqInput;
        if (!text.trim()) return;
        const newLayer: EquationLayer = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
            expression: text.trim(),
            color: PALETTE[layers.length % PALETTE.length],
            visible: true,
        };
        const updated = [...layers, newLayer];
        setLayers(updated);
        setNewEqInput("");
        const visibleEqs = updated.filter(l => l.visible).map(l => l.expression);
        onGenerateMulti(visibleEqs);
    };

    const handleRemoveLayer = (id: string) => {
        const updated = layers.filter(l => l.id !== id);
        setLayers(updated);
        const visibleEqs = updated.filter(l => l.visible).map(l => l.expression);
        if (visibleEqs.length > 0) {
            onGenerateMulti(visibleEqs);
        }
    };

    const handleToggleVisible = (id: string) => {
        const updated = layers.map(l => (l.id === id ? { ...l, visible: !l.visible } : l));
        setLayers(updated);
        const visibleEqs = updated.filter(l => l.visible).map(l => l.expression);
        if (visibleEqs.length > 0) {
            onGenerateMulti(visibleEqs);
        }
    };

    const handleLoadCombo = (combo: string[], dim: DimensionMode = "2D") => {
        const newLayers: EquationLayer[] = combo.map((eq, i) => ({
            id: Date.now().toString() + i,
            expression: eq,
            color: PALETTE[i % PALETTE.length],
            visible: true,
        }));
        setLayers(newLayers);
        setDimensionMode(dim);
        onGenerateMulti(combo, dim);
    };

    const quickCombos = [
        {
            title: "Parabola & Line Intersections",
            eqs: ["y = x^2 - 4", "y = 2*x + 1", "y = -x^2 + 6"],
            dim: "2D" as const,
        },
        {
            title: "Fourier Square Wave Harmonics",
            eqs: ["y = sin(x)", "y = sin(x) + (1/3)*sin(3*x)", "y = sin(x) + (1/3)*sin(3*x) + (1/5)*sin(5*x)"],
            dim: "2D" as const,
        },
        {
            title: "3D Dual Paraboloid Manifolds",
            eqs: ["z = x^2 + y^2", "z = 8 - (x^2 + y^2)"],
            dim: "3D" as const,
        },
        {
            title: "Trig Wave Interference",
            eqs: ["y = sin(2*x)", "y = cos(3*x)", "y = sin(2*x) + cos(3*x)"],
            dim: "2D" as const,
        },
    ];

    return (
        <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                <div>
                    <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span>Multi-Equation Overlay Studio</span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                        Graph and layer multiple functions simultaneously with automated intersection solver
                    </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    {(["AUTO", "1D", "2D", "3D"] as DimensionMode[]).map(dim => (
                        <button
                            key={dim}
                            type="button"
                            onClick={() => {
                                setDimensionMode(dim);
                                const visibleEqs = layers.filter(l => l.visible).map(l => l.expression);
                                if (visibleEqs.length > 0) onGenerateMulti(visibleEqs, dim);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                                dimensionMode === dim
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                            }`}
                        >
                            {dim}
                        </button>
                    ))}
                </div>
            </div>

            {/* Preset Multi-Equation Combos */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Quick Multi-Curve Presets:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quickCombos.map(combo => (
                        <button
                            key={combo.title}
                            type="button"
                            onClick={() => {
                                handleLoadCombo(combo.eqs, combo.dim);
                            }}
                            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex flex-col text-left gap-1 transition-all text-xs group"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="font-bold text-slate-200 group-hover:text-cyan-300">
                                    {combo.title}
                                </span>
                                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded">
                                    {combo.dim} ({combo.eqs.length} layers)
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 truncate w-full">
                                {combo.eqs.join("  •  ")}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Layer List */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Equation Layers ({layers.length}):
                </label>

                {layers.map((layer, idx) => (
                    <div
                        key={layer.id}
                        className="flex items-center gap-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/90 shadow-inner group"
                    >
                        <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: layer.color }}
                        />
                        <span className="text-xs font-mono font-bold text-slate-400 shrink-0">f{idx + 1}(x):</span>
                        <input
                            type="text"
                            value={layer.expression}
                            onChange={e => {
                                const nextVal = e.target.value;
                                const updated = layers.map(l =>
                                    l.id === layer.id ? { ...l, expression: nextVal } : l,
                                );
                                setLayers(updated);
                            }}
                            onBlur={() => {
                                const visibleEqs = layers.filter(l => l.visible).map(l => l.expression);
                                onGenerateMulti(visibleEqs);
                            }}
                            className="flex-1 bg-transparent text-cyan-200 font-mono text-xs focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => handleToggleVisible(layer.id)}
                            className="p-1 text-slate-400 hover:text-cyan-300"
                            title={layer.visible ? "Hide Curve" : "Show Curve"}
                        >
                            {layer.visible ? (
                                <Eye className="w-3.5 h-3.5" />
                            ) : (
                                <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRemoveLayer(layer.id)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Delete Layer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}

                {/* Add New Layer Input */}
                <div className="flex items-center gap-2 pt-1">
                    <input
                        type="text"
                        value={newEqInput}
                        onChange={e => setNewEqInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddLayer();
                            }
                        }}
                        placeholder="Add another equation: e.g. y = cos(x) or y = 3*x - 2..."
                        className="flex-1 bg-[#050811] text-cyan-200 text-xs font-mono p-2.5 rounded-xl border border-slate-800 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => handleAddLayer()}
                        className="px-3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Layer</span>
                    </button>
                </div>
            </div>

            {/* Curve Intersections Card */}
            {intersections.length > 0 && (
                <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/40 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Target className="w-3.5 h-3.5" />
                        <span>Found {intersections.length} Intersection Point(s):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {intersections.map((pt, i) => (
                            <span
                                key={i}
                                className="text-xs font-mono font-bold bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded border border-amber-700/50 shadow-sm"
                            >
                                ({pt.x.toFixed(2)}, {pt.y.toFixed(2)}) [{pt.equations.join(" & ")}]
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
