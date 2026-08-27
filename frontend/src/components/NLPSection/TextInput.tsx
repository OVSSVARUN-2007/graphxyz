import { Binary, Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import React from "react";
import { DimensionMode, DimReductionMethod, PresetText } from "../../types/graph";

interface TextInputProps {
    text: string;
    setText: (text: string) => void;
    onAnalyze: (method: DimReductionMethod, dimension: DimensionMode) => void;
    isLoading: boolean;
    reductionMethod: DimReductionMethod;
    setReductionMethod: (method: DimReductionMethod) => void;
    dimensionMode: DimensionMode;
    setDimensionMode: (dim: DimensionMode) => void;
    samplePresets: PresetText[];
}

export const TextInput: React.FC<TextInputProps> = ({
    text,
    setText,
    onAnalyze,
    isLoading,
    reductionMethod,
    setReductionMethod,
    dimensionMode,
    setDimensionMode,
    samplePresets,
}) => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(Boolean).length : 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || isLoading) return;
        onAnalyze(reductionMethod, dimensionMode);
    };

    return (
        <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <span>Natural Language Text Analysis Engine</span>
                        <span className="text-[11px] font-normal text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                            NLP • Neural Embeddings • ML
                        </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                        Enter any freeform text to extract sentiment, emotions, topics, keywords, and 2D/3D semantic
                        manifolds.
                    </p>
                </div>

                {/* Dimension Override Selector */}
                <div className="flex items-center p-1 bg-slate-900/90 rounded-lg border border-slate-800 text-xs">
                    {(["AUTO", "1D", "2D", "3D"] as DimensionMode[]).map(dim => (
                        <button
                            key={dim}
                            type="button"
                            onClick={() => setDimensionMode(dim)}
                            className={`px-2.5 py-1 rounded font-semibold transition-all ${
                                dimensionMode === dim
                                    ? "bg-purple-500 text-slate-950 shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            {dim === "AUTO" ? "Auto Detect" : dim}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Sample Prompts */}
            <div className="mb-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Sample Texts:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {samplePresets.map(preset => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => setText(preset.text)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-purple-950/60 hover:text-purple-300 text-slate-300 border border-slate-800/80 hover:border-purple-800/60 transition-all duration-150 active:scale-95"
                        >
                            {preset.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Text Area Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <textarea
                        rows={5}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Type or paste any paragraph, essay, diary entry, article, review, or thoughts here..."
                        className="w-full bg-[#070b14]/90 text-purple-200 font-sans text-sm md:text-base p-4 rounded-xl border border-purple-900/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all placeholder:text-slate-600 shadow-inner leading-relaxed"
                    />
                    {/* Live Text Stats Counter */}
                    <div className="absolute right-3 bottom-3 flex items-center gap-3 text-[11px] text-slate-500 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/60">
                        <span>{words} words</span>
                        <span>•</span>
                        <span>{sentences} sentences</span>
                        <span>•</span>
                        <span>{chars} chars</span>
                    </div>
                </div>

                {/* Algorithm Selection: PCA vs t-SNE vs UMAP */}
                <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Binary className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                            <div className="text-xs font-semibold text-slate-200">
                                Dimensionality Reduction Algorithm
                            </div>
                            <div className="text-[11px] text-slate-400">
                                Projects 384-dimensional Transformer embeddings into 2D / 3D manifold space
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800/80">
                        {(["PCA", "TSNE", "UMAP"] as DimReductionMethod[]).map(method => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setReductionMethod(method)}
                                className={`px-3 py-1 text-xs font-mono font-semibold rounded transition-all ${
                                    reductionMethod === method
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={isLoading || !text.trim()}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 shadow-lg ${
                            isLoading || !text.trim()
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                                : "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-400 hover:to-rose-400 text-white shadow-purple-500/25 active:scale-[0.98]"
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                <span>Running Deep Learning Pipeline...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span>Analyze Text & Generate Graph</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
