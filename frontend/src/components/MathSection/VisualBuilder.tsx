import { Activity, CircleDot, Donut, Globe, Heart, Orbit, Sparkles, Waves } from "lucide-react";
import React from "react";

interface VisualBuilderProps {
    onSelectFormula: (formula: string, dimension?: "1D" | "2D" | "3D") => void;
    onAppendSnippet: (snippet: string) => void;
}

export const VisualBuilder: React.FC<VisualBuilderProps> = ({ onSelectFormula, onAppendSnippet }) => {
    const templates = [
        {
            title: "3D Heart Surface",
            formula: "(x^2 + 2.25*y^2 + z^2 - 1)^3 - x^2*z^3 - 0.1125*y^2*z^3 = 0",
            dim: "3D" as const,
            icon: Heart,
            color: "from-rose-500 to-pink-600",
        },
        {
            title: "Wave Ripple",
            formula: "z = \\sin(x)\\cos(y)",
            dim: "3D" as const,
            icon: Waves,
            color: "from-cyan-500 to-blue-600",
        },
        {
            title: "Sombrero Sinc",
            formula: "z = \\frac{\\sin(\\sqrt{x^2 + y^2})}{\\sqrt{x^2 + y^2} + 0.01}",
            dim: "3D" as const,
            icon: Sparkles,
            color: "from-purple-500 to-indigo-600",
        },
        {
            title: "3D Sphere",
            formula: "x^2 + y^2 + z^2 = 25",
            dim: "3D" as const,
            icon: Globe,
            color: "from-emerald-500 to-teal-600",
        },
        {
            title: "3D Donut Torus",
            formula: "(x^2 + y^2 + z^2 + 16 - 4)^2 - 64*(x^2 + y^2) = 0",
            dim: "3D" as const,
            icon: Donut,
            color: "from-amber-500 to-orange-600",
        },
        {
            title: "Paraboloid Bowl",
            formula: "z = x^2 + y^2",
            dim: "3D" as const,
            icon: CircleDot,
            color: "from-sky-500 to-blue-600",
        },
        {
            title: "Saddle Pass",
            formula: "z = x^2 - y^2",
            dim: "3D" as const,
            icon: Activity,
            color: "from-violet-500 to-fuchsia-600",
        },
        {
            title: "3D Helix Spiral",
            formula: "x = \\cos(t), y = \\sin(t), z = 0.2*t",
            dim: "3D" as const,
            icon: Orbit,
            color: "from-pink-500 to-purple-600",
        },
    ];

    const quickFunctions = [
        { label: "x²", snippet: "x^2" },
        { label: "√x", snippet: "sqrt(x)" },
        { label: "sin(x)", snippet: "sin(x)" },
        { label: "cos(x)", snippet: "cos(x)" },
        { label: "tan(x)", snippet: "tan(x)" },
        { label: "eˣ", snippet: "e^x" },
        { label: "ln(x)", snippet: "ln(x)" },
        { label: "|x|", snippet: "abs(x)" },
        { label: "Fraction (a/b)", snippet: "(a)/(b)" },
        { label: "x² + y²", snippet: "x^2 + y^2" },
        { label: "Parametric (t)", snippet: "x = cos(t), y = sin(t)" },
        { label: "Polar r(θ)", snippet: "r = 2*sin(3*theta)" },
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            {/* 3D & 2D Shape Templates */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Click to Load Standard Shape Template:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {templates.map(tpl => {
                        const Icon = tpl.icon;
                        return (
                            <button
                                key={tpl.title}
                                type="button"
                                onClick={() => onSelectFormula(tpl.formula, tpl.dim)}
                                className="group p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex flex-col items-center text-center gap-1.5 transition-all duration-150 hover:scale-105 active:scale-95 shadow-md"
                            >
                                <div
                                    className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${tpl.color} flex items-center justify-center shadow-sm`}
                                >
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                                    {tpl.title}
                                </span>
                                <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded">
                                    {tpl.dim}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Function Building Blocks */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Mathematical Building Blocks (Click to Append):
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {quickFunctions.map(fn => (
                        <button
                            key={fn.label}
                            type="button"
                            onClick={() => onAppendSnippet(fn.snippet)}
                            className="text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700/60 transition-all active:scale-95"
                        >
                            {fn.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
