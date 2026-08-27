import React from "react";

interface LaTeXToolbarProps {
    onInsert: (snippet: string) => void;
}

export const LaTeXToolbar: React.FC<LaTeXToolbarProps> = ({ onInsert }) => {
    const tools = [
        { label: "x²", insert: "x^2", tooltip: "Square" },
        { label: "xⁿ", insert: "x^{n}", tooltip: "Power" },
        { label: "a/b", insert: "\\frac{a}{b}", tooltip: "Fraction" },
        { label: "√x", insert: "\\sqrt{x}", tooltip: "Square Root" },
        { label: "ⁿ√x", insert: "\\sqrt[n]{x}", tooltip: "N-th Root" },
        { label: "sin", insert: "\\sin(x)", tooltip: "Sine" },
        { label: "cos", insert: "\\cos(x)", tooltip: "Cosine" },
        { label: "tan", insert: "\\tan(x)", tooltip: "Tangent" },
        { label: "eˣ", insert: "e^{x}", tooltip: "Exponential" },
        { label: "ln", insert: "\\ln(x)", tooltip: "Natural Log" },
        { label: "log", insert: "\\log(x)", tooltip: "Logarithm" },
        { label: "π", insert: "\\pi", tooltip: "Pi" },
        { label: "θ", insert: "\\theta", tooltip: "Theta" },
        { label: "|x|", insert: "|x|", tooltip: "Absolute Value" },
        { label: "y =", insert: "y = ", tooltip: "Explicit 2D" },
        { label: "z =", insert: "z = ", tooltip: "Explicit 3D" },
        { label: "r =", insert: "r = ", tooltip: "Polar" },
        { label: "x² + y²", insert: "x^2 + y^2 = 25", tooltip: "Implicit 2D Circle" },
        { label: "x, y (t)", insert: "x = \\cos(t), y = \\sin(t)", tooltip: "Parametric" },
    ];

    return (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/60 rounded-lg border border-slate-800/80 mb-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 select-none">
                Math Quick Insert:
            </span>
            {tools.map((item, idx) => (
                <button
                    key={idx}
                    type="button"
                    onClick={() => onInsert(item.insert)}
                    title={item.tooltip}
                    className="px-2 py-1 text-xs font-mono rounded bg-slate-800/90 text-cyan-300 hover:bg-cyan-950 hover:text-cyan-200 hover:border-cyan-700/60 border border-slate-700/60 transition-all duration-150 active:scale-95 shadow-sm"
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};
