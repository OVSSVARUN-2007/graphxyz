import { Compass, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import React, { useState } from "react";
import { promptToMath } from "../../services/api";

import { DimensionMode } from "../../types/graph";

interface AICopilotPromptProps {
    onEquationGenerated: (
        equation: string,
        dimension?: DimensionMode,
        ranges?: Record<string, [number, number]>,
    ) => void;
}

export const AICopilotPrompt: React.FC<AICopilotPromptProps> = ({ onEquationGenerated }) => {
    const [promptText, setPromptText] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [explanation, setExplanation] = useState<string | null>(null);

    const samplePrompts = [
        "3D heart-shaped algebraic surface",
        "Rippling water wave interference in 3D",
        "Sombrero diffraction sinc pattern",
        "Sphere of radius 6",
        "3D Donut Torus ring",
        "4D travelling wave with time t",
        "Damped harmonic wave that decays exponentially",
        "Euler identity in complex plane",
    ];

    const handleGenerate = async (queryText?: string) => {
        const q = queryText || promptText;
        if (!q.trim() || isLoading) return;
        setIsLoading(true);
        setExplanation(null);

        try {
            const res = await promptToMath(q);
            setExplanation(res.explanation);
            onEquationGenerated(res.equation, res.dimension, res.suggested_ranges);
        } catch (err: any) {
            setExplanation(err.message || "Could not generate equation from prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Describe any graph in plain English:</span>
                </label>
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleGenerate();
                        }
                    }}
                    placeholder="e.g. '3D heart surface' or 'sombrero wave' or 'sphere of radius 8'..."
                    className="w-full bg-[#050811] text-cyan-200 text-sm p-3 pr-24 rounded-xl border border-cyan-900/50 focus:border-cyan-400 focus:outline-none shadow-inner font-medium placeholder:text-slate-600"
                />
                <button
                    type="button"
                    disabled={isLoading || !promptText.trim()}
                    onClick={() => handleGenerate()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                >
                    {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Ask AI</span>
                        </>
                    )}
                </button>
            </div>

            {/* Sample prompt chips */}
            <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                    Try Quick AI Prompts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {samplePrompts.map(p => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => {
                                setPromptText(p);
                                handleGenerate(p);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-cyan-950/60 hover:text-cyan-200 text-slate-300 border border-slate-800 hover:border-cyan-700/60 transition-all active:scale-95 shadow-sm"
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {explanation && (
                <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-800/40 text-xs text-cyan-200 animate-in fade-in duration-150">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-0.5">
                        <Compass className="w-3.5 h-3.5" />
                        <span>AI Translation Rationale</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{explanation}</p>
                </div>
            )}
        </div>
    );
};
