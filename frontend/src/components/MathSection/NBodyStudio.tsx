import { Orbit, Play, RefreshCw } from "lucide-react";
import React, { useState } from "react";
import { evaluateNBody } from "../../services/api";

interface NBodyStudioProps {
    onCustomGraphData: (data: any) => void;
    isLoading: boolean;
}

export const NBodyStudio: React.FC<NBodyStudioProps> = ({ onCustomGraphData, isLoading: parentLoading }) => {
    const [preset, setPreset] = useState<string>("three_body");
    const [numSteps, setNumSteps] = useState<number>(600);
    const [dt, setDt] = useState<number>(0.015);
    const [G, setG] = useState<number>(1.0);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    const presets = [
        { id: "three_body", label: "Chaotic 3-Body (Figure-8)", icon: "♾️" },
        { id: "solar_system", label: "Inner Solar System", icon: "🪐" },
        { id: "binary_stars", label: "Binary Stars + Exoplanet", icon: "✨" },
    ];

    const handleSimulate = async (selectedPreset?: string) => {
        const p = selectedPreset || preset;
        setIsCalculating(true);
        try {
            const res = await evaluateNBody(p, numSteps, dt, G);
            if (res?.data) {
                onCustomGraphData(res.data);
            }
        } catch (err) {
            console.error("N-Body simulation failed:", err);
        } finally {
            setIsCalculating(false);
        }
    };

    return (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-cyan-800/40 bg-gradient-to-br from-[#060e1d]/90 via-[#040814]/90 to-[#0c051a]/90 space-y-4 shadow-xl shadow-cyan-950/20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-800/30 pb-3">
                <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-cyan-200 flex items-center gap-2">
                        <Orbit className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                        <span>Astrophysics: Gravitational N-Body Simulator</span>
                    </h2>
                    <p className="text-[11px] text-cyan-300/80">
                        Real-time Newtonian multi-body celestial orbital dynamics (F = G m₁m₂ / r²)
                    </p>
                </div>

                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    3D Physics
                </span>
            </div>

            {/* Preset Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {presets.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                            setPreset(item.id);
                            handleSimulate(item.id);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${
                            preset === item.id
                                ? "bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50"
                                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                    >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Controls: Timesteps, dt, Gravitational constant G */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Timesteps:</span>
                        <span className="font-mono text-cyan-400 font-bold">{numSteps}</span>
                    </div>
                    <input
                        type="range"
                        min="200"
                        max="1500"
                        step="50"
                        value={numSteps}
                        onChange={e => setNumSteps(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                </div>

                <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Integration dt:</span>
                        <span className="font-mono text-cyan-400 font-bold">{dt}</span>
                    </div>
                    <input
                        type="range"
                        min="0.005"
                        max="0.04"
                        step="0.005"
                        value={dt}
                        onChange={e => setDt(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                </div>

                <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Gravitational G:</span>
                        <span className="font-mono text-cyan-400 font-bold">{G}</span>
                    </div>
                    <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={G}
                        onChange={e => setG(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                </div>
            </div>

            {/* Action Button */}
            <button
                type="button"
                disabled={isCalculating || parentLoading}
                onClick={() => handleSimulate()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {isCalculating ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Simulating Celestial Orbits...</span>
                    </>
                ) : (
                    <>
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Run 3D Gravitational Simulation</span>
                    </>
                )}
            </button>
        </div>
    );
};
