import { Eye, Maximize2, Palette, RotateCcw } from "lucide-react";
import React from "react";
import { AppMode, DimensionMode } from "../../types/graph";

interface GraphControlsProps {
    mode: AppMode;
    dimensionMode: DimensionMode;
    setDimensionMode: (dim: DimensionMode) => void;
    colorscale: string;
    setColorscale: (cs: string) => void;
    surfaceMode: "surface" | "wireframe" | "points";
    setSurfaceMode: (mode: "surface" | "wireframe" | "points") => void;
    nlpViewMode: string;
    setNlpViewMode: (view: string) => void;
    availableNlpViews: string[];
    onResetView: () => void;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    is3D: boolean;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
    mode,
    dimensionMode,
    setDimensionMode,
    colorscale,
    setColorscale,
    surfaceMode,
    setSurfaceMode,
    nlpViewMode,
    setNlpViewMode,
    availableNlpViews,
    onResetView,
    onToggleFullscreen,
    isFullscreen,
    is3D,
}) => {
    const COLORSCALES = [
        { label: "Viridis", value: "Viridis" },
        { label: "Plasma", value: "Plasma" },
        { label: "Magma", value: "Magma" },
        { label: "Turbo", value: "Turbo" },
        { label: "Electric", value: "Electric" },
        { label: "Jet", value: "Jet" },
        { label: "Cyan-Blue", value: "Blues" },
    ];

    const formatViewLabel = (view: string) => {
        switch (view) {
            case "3D_SEMANTIC_MAP":
                return "3D Semantic Space";
            case "2D_SEMANTIC_MAP":
                return "2D Semantic Map";
            case "SENTIMENT_PROGRESSION":
                return "Sentiment Progression Line";
            case "EMOTION_RADAR":
                return "Emotion Radar Chart";
            case "TOPIC_DISTRIBUTION":
                return "Topic Probabilities Bar";
            case "KEYWORD_RELEVANCE":
                return "Keyword Relevance Bar";
            case "WORD_FREQUENCY":
                return "Word Frequency Chart";
            default:
                return view.replace(/_/g, " ");
        }
    };

    return (
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left controls: Dimension Selector & NLP View Selector */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Dimension Selector */}
                <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                    {(mode === "equation"
                        ? (["AUTO", "1D", "2D", "3D", "4D"] as DimensionMode[])
                        : (["AUTO", "1D", "2D", "3D"] as DimensionMode[])
                    ).map(dim => (
                        <button
                            key={dim}
                            type="button"
                            onClick={() => setDimensionMode(dim)}
                            className={`px-2.5 py-1 rounded font-semibold transition-all ${
                                dimensionMode === dim
                                    ? mode === "equation"
                                        ? "bg-cyan-500 text-slate-950 shadow-sm"
                                        : "bg-purple-500 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            {dim === "AUTO" ? "Auto" : dim}
                        </button>
                    ))}
                </div>

                {/* NLP Multi-View Mode Dropdown */}
                {mode === "nlp" && availableNlpViews.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <Eye className="w-3.5 h-3.5 text-purple-400" />
                        <select
                            value={nlpViewMode}
                            onChange={e => setNlpViewMode(e.target.value)}
                            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                        >
                            {availableNlpViews.map(view => (
                                <option key={view} value={view} className="bg-slate-900 text-slate-200">
                                    {formatViewLabel(view)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* 3D Surface Render Style Toggle */}
                {is3D && mode === "equation" && (
                    <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                        {(["surface", "wireframe", "points"] as const).map(style => (
                            <button
                                key={style}
                                type="button"
                                onClick={() => setSurfaceMode(style)}
                                className={`px-2 py-1 rounded capitalize font-medium transition-all ${
                                    surfaceMode === style
                                        ? "bg-slate-800 text-cyan-300 shadow-sm border border-cyan-800/60"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                )}

                {/* Color Palette Picker */}
                {is3D && (
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <Palette className="w-3.5 h-3.5 text-cyan-400" />
                        <select
                            value={colorscale}
                            onChange={e => setColorscale(e.target.value)}
                            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                        >
                            {COLORSCALES.map(cs => (
                                <option key={cs.value} value={cs.value} className="bg-slate-900 text-slate-200">
                                    {cs.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right Controls: Reset View, Fullscreen */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onResetView}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors"
                    title="Reset Camera & Zoom"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset View</span>
                </button>

                <button
                    type="button"
                    onClick={onToggleFullscreen}
                    className="p-1.5 rounded-lg bg-slate-950 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    <Maximize2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
