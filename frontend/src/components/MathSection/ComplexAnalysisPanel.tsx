import { Orbit, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { evaluateComplexAnalysis } from "../../services/api";

interface ComplexAnalysisPanelProps {
    onGraphData: (data: any) => void;
    isLoading: boolean;
}

export const ComplexAnalysisPanel: React.FC<ComplexAnalysisPanelProps> = ({ onGraphData }) => {
    const [funcStr, setFuncStr] = useState<string>("z^3 - 1");
    const [domain, setDomain] = useState<number>(3.0);
    const [gridRes, setGridRes] = useState<number>(80);

    const presets = [
        { title: "Roots of Unity z³ - 1", expr: "z^3 - 1" },
        { title: "Complex Exponential eᶻ", expr: "e^z" },
        { title: "Complex Sine sin(z)", expr: "sin(z)" },
        { title: "Simple Pole 1/z", expr: "1/z" },
        { title: "Branch Cut √z", expr: "sqrt(z)" },
        { title: "Mandelbrot Core z² + c", expr: "z^2 - 0.75" },
    ];

    const fetchComplex = async (expr: string = funcStr, d = domain, r = gridRes) => {
        try {
            const res = await evaluateComplexAnalysis(expr, r, d);
            onGraphData(res.data);
        } catch (err) {
            console.error("Complex analysis failed:", err);
        }
    };

    useEffect(() => {
        fetchComplex();
    }, []);

    return (
        <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-indigo-900/50 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
                <div>
                    <h2 className="text-base font-extrabold text-indigo-100 flex items-center gap-2">
                        <Orbit className="w-4 h-4 text-indigo-400" />
                        <span>Complex Analysis & Riemann Surfaces</span>
                    </h2>
                    <p className="text-[11px] text-indigo-300/80">
                        Domain coloring mapping Phase Angle $\arg(f(z))$ to HSV spectrum and Modulus $|f(z)|$ to 3D
                        elevation
                    </p>
                </div>
            </div>

            {/* Preset Chips */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Famous Complex Functions:
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {presets.map(p => (
                        <button
                            key={p.title}
                            type="button"
                            onClick={() => {
                                setFuncStr(p.expr);
                                fetchComplex(p.expr);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                                funcStr === p.expr
                                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                                    : "bg-slate-950 text-slate-300 border-slate-800 hover:border-indigo-500"
                            }`}
                        >
                            {p.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Formula Input */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={funcStr}
                    onChange={e => setFuncStr(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            fetchComplex(funcStr);
                        }
                    }}
                    placeholder="f(z) = z^4 - 2*z^2 + 1..."
                    className="flex-1 bg-[#050811] text-indigo-200 font-mono text-xs p-2.5 rounded-xl border border-slate-800 focus:border-indigo-400 focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => fetchComplex(funcStr)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Render Riemann Surface</span>
                </button>
            </div>
        </div>
    );
};
