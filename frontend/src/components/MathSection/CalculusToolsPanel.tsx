import { Activity, Sigma, Target } from "lucide-react";
import React from "react";
import { CalculusOptions } from "../../services/api";

interface CalculusToolsPanelProps {
    options: CalculusOptions;
    onChangeOptions: (opts: CalculusOptions) => void;
    onApplyCalculus: (opts: CalculusOptions) => void;
    domain: [number, number];
}

export const CalculusToolsPanel: React.FC<CalculusToolsPanelProps> = ({
    options,
    onChangeOptions,
    onApplyCalculus,
    domain,
}) => {
    const handleToggleTangent = () => {
        const updated = { ...options, show_tangent: !options.show_tangent };
        onChangeOptions(updated);
        onApplyCalculus(updated);
    };

    const handleToggleIntegral = () => {
        const updated = { ...options, show_integral: !options.show_integral };
        onChangeOptions(updated);
        onApplyCalculus(updated);
    };

    return (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Calculus & Mathematical Analysis Suite</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Tangent Line Feature */}
                <div
                    className={`p-3 rounded-lg border transition-all ${
                        options.show_tangent ? "bg-pink-950/40 border-pink-700/60" : "bg-slate-950/60 border-slate-800"
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                            <Target className="w-3.5 h-3.5 text-pink-400" />
                            <span>Tangent Line & Slope</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleTangent}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                options.show_tangent
                                    ? "bg-pink-600 text-white"
                                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            {options.show_tangent ? "Enabled" : "Disabled"}
                        </button>
                    </div>

                    {options.show_tangent && (
                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>Touchpoint x₀:</span>
                                <span className="font-mono text-pink-300 font-bold">
                                    {(options.tangent_point ?? 1.0).toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={domain[0]}
                                max={domain[1]}
                                step="0.1"
                                value={options.tangent_point ?? 1.0}
                                onChange={e => {
                                    const updated = { ...options, tangent_point: parseFloat(e.target.value) };
                                    onChangeOptions(updated);
                                    onApplyCalculus(updated);
                                }}
                                className="w-full accent-pink-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                        </div>
                    )}
                </div>

                {/* 2. Definite Integral & Area Shading */}
                <div
                    className={`p-3 rounded-lg border transition-all ${
                        options.show_integral
                            ? "bg-emerald-950/40 border-emerald-700/60"
                            : "bg-slate-950/60 border-slate-800"
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                            <Sigma className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Riemann Integral (∫ f dx)</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleIntegral}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                options.show_integral
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            {options.show_integral ? "Enabled" : "Disabled"}
                        </button>
                    </div>

                    {options.show_integral && (
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>Integration Bounds [a, b]:</span>
                                <span className="font-mono text-emerald-300 font-bold">
                                    [{options.integral_range?.[0] ?? 0}, {options.integral_range?.[1] ?? 3}]
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={options.integral_range?.[0] ?? 0}
                                    onChange={e => {
                                        const a = parseFloat(e.target.value) || 0;
                                        const b = options.integral_range?.[1] ?? 3;
                                        const updated = { ...options, integral_range: [a, b] as [number, number] };
                                        onChangeOptions(updated);
                                        onApplyCalculus(updated);
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                                />
                                <span className="text-slate-500 text-xs">to</span>
                                <input
                                    type="number"
                                    value={options.integral_range?.[1] ?? 3}
                                    onChange={e => {
                                        const a = options.integral_range?.[0] ?? 0;
                                        const b = parseFloat(e.target.value) || 3;
                                        const updated = { ...options, integral_range: [a, b] as [number, number] };
                                        onChangeOptions(updated);
                                        onApplyCalculus(updated);
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
