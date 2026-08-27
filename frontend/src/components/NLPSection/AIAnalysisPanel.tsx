import { Brain, Cpu, Gauge, HeartHandshake, Layers, ListTree, Smile, Sparkles, Tag } from "lucide-react";
import React, { useState } from "react";
import { NLPAnalysisData } from "../../types/graph";
import { SentenceTrajectory } from "./SentenceTrajectory";

interface AIAnalysisPanelProps {
    data: NLPAnalysisData;
    selectedSentenceIndex: number | null;
    onSelectSentence: (idx: number | null) => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ data, selectedSentenceIndex, onSelectSentence }) => {
    const [activeTab, setActiveTab] = useState<"overview" | "sentiment" | "topics" | "trajectory" | "insights">(
        "overview",
    );

    const { sentiment, emotions, topics, keywords, model_insights, recommendation } = data;

    return (
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "overview"
                                ? "bg-purple-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                    >
                        <Gauge className="w-3.5 h-3.5" />
                        <span>Overview & Pipeline</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("sentiment")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "sentiment"
                                ? "bg-purple-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                    >
                        <Smile className="w-3.5 h-3.5" />
                        <span>Sentiment & Emotions</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("topics")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "topics"
                                ? "bg-purple-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                    >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Topics & Keywords</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("trajectory")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "trajectory"
                                ? "bg-purple-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                    >
                        <ListTree className="w-3.5 h-3.5" />
                        <span>Sentences ({data.sentences.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("insights")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "insights"
                                ? "bg-purple-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                    >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Neural Insights</span>
                    </button>
                </div>

                <div className="hidden md:flex items-center gap-1.5 text-[11px] text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800/40">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Transformer (all-MiniLM-L6-v2)</span>
                </div>
            </div>

            {/* Tab 1: Overview & Pipeline */}
            {activeTab === "overview" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Recommendation Banner */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/70 via-slate-900/80 to-slate-900 border border-purple-800/50 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                                AI Recommendation: {recommendation.recommended_visualization.replace(/_/g, " ")}
                            </div>
                            <div className="text-xs text-slate-300 mt-0.5">{recommendation.rationale}</div>
                        </div>
                    </div>

                    {/* Quick Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80">
                            <div className="text-[11px] font-semibold text-slate-400">Total Tokens / Words</div>
                            <div className="text-lg font-mono font-bold text-slate-100 mt-1">
                                {model_insights.token_count}
                            </div>
                            <div className="text-[10px] text-slate-500">
                                {model_insights.unique_tokens} unique vocabulary
                            </div>
                        </div>

                        <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80">
                            <div className="text-[11px] font-semibold text-slate-400">Overall Sentiment</div>
                            <div
                                className={`text-lg font-bold mt-1 ${
                                    sentiment.label === "Positive"
                                        ? "text-emerald-400"
                                        : sentiment.label === "Negative"
                                          ? "text-rose-400"
                                          : "text-amber-400"
                                }`}
                            >
                                {sentiment.label}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                Compound:{" "}
                                {sentiment.compound_score > 0
                                    ? `+${sentiment.compound_score}`
                                    : sentiment.compound_score}
                            </div>
                        </div>

                        <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80">
                            <div className="text-[11px] font-semibold text-slate-400">Top Detected Emotion</div>
                            <div className="text-lg font-bold text-purple-300 mt-1">
                                {Object.entries(emotions).sort((a, b) => b[1] - a[1])[0]?.[0] || "Neutral"}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                Score:{" "}
                                {((Object.entries(emotions).sort((a, b) => b[1] - a[1])[0]?.[1] || 0) * 100).toFixed(0)}
                                %
                            </div>
                        </div>

                        <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80">
                            <div className="text-[11px] font-semibold text-slate-400">Primary Topic</div>
                            <div className="text-lg font-bold text-cyan-300 mt-1 truncate">
                                {Object.keys(topics)[0] || "General"}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                Prob: {((Object.values(topics)[0] || 0) * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>

                    {/* Transparent AI Processing Flowchart */}
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/80">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-purple-400" />
                            <span>Transparent AI Pipeline & Processing Stages</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                                <div className="font-semibold text-cyan-400">1. Text Preprocessing</div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                    Segmented {model_insights.sentence_count} sentences and {model_insights.token_count}{" "}
                                    word tokens.
                                </div>
                            </div>

                            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                                <div className="font-semibold text-purple-400">2. Deep Neural Embeddings</div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                    Encoded via Transformer into 384-dimensional dense semantic vectors.
                                </div>
                            </div>

                            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                                <div className="font-semibold text-pink-400">3. Dimensionality Reduction</div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                    Projected via {model_insights.dimensionality_reduction} to interactive 2D & 3D
                                    space.
                                </div>
                            </div>

                            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                                <div className="font-semibold text-emerald-400">4. Sentiment & Emotion ML</div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                    Calibrated multi-class sentiment & 7-label emotion intensity estimation.
                                </div>
                            </div>

                            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                                <div className="font-semibold text-amber-400">5. Semantic Topic Alignment</div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                    Zero-shot cosine similarity across 9 knowledge & domain topics.
                                </div>
                            </div>

                            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                                <div className="font-semibold text-sky-400">6. Graph Recommendation</div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                    Automatically generated interactive 1D/2D/3D Plotly visual coordinates.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Sentiment & Emotions */}
            {activeTab === "sentiment" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sentiment Probability Bars */}
                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-3">
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Smile className="w-4 h-4 text-emerald-400" />
                                <span>Calibrated Sentiment Probabilities</span>
                            </h4>

                            {/* Positive */}
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-emerald-400">Positive</span>
                                    <span className="font-mono text-slate-300">
                                        {(sentiment.positive * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${sentiment.positive * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Neutral */}
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-amber-400">Neutral</span>
                                    <span className="font-mono text-slate-300">
                                        {(sentiment.neutral * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${sentiment.neutral * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Negative */}
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-rose-400">Negative</span>
                                    <span className="font-mono text-slate-300">
                                        {(sentiment.negative * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                        className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${sentiment.negative * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emotions Breakdown */}
                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <HeartHandshake className="w-4 h-4 text-pink-400" />
                                <span>Emotion Intensity Spectrum</span>
                            </h4>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(emotions).map(([emotion, score]) => (
                                    <div
                                        key={emotion}
                                        className="p-2 bg-slate-950 rounded-lg border border-slate-800/70"
                                    >
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                                            <span>{emotion}</span>
                                            <span className="font-mono text-pink-400">{(score * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                                                style={{ width: `${Math.min(100, score * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 3: Topics & Keywords */}
            {activeTab === "topics" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Topic Probabilities */}
                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Tag className="w-4 h-4 text-cyan-400" />
                                <span>Semantic Topic Distribution</span>
                            </h4>

                            <div className="space-y-2">
                                {Object.entries(topics)
                                    .slice(0, 6)
                                    .map(([topic, prob]) => (
                                        <div key={topic}>
                                            <div className="flex justify-between text-xs font-medium text-slate-300 mb-0.5">
                                                <span>{topic}</span>
                                                <span className="font-mono text-cyan-400">
                                                    {(prob * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                                                <div
                                                    className="bg-cyan-500 h-1.5 rounded-full"
                                                    style={{ width: `${prob * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Keyword Extraction */}
                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span>Top Key Concepts & Importance</span>
                            </h4>

                            <div className="flex flex-wrap gap-2">
                                {keywords.map((kw, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2"
                                    >
                                        <span className="text-xs font-semibold text-amber-300 capitalize">
                                            {kw.keyword}
                                        </span>
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                            rel: {kw.relevance.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 4: Sentence Trajectory */}
            {activeTab === "trajectory" && (
                <SentenceTrajectory
                    sentences={data.sentences}
                    selectedSentenceIndex={selectedSentenceIndex}
                    onSelectSentence={onSelectSentence}
                />
            )}

            {/* Tab 5: Neural Insights & Deep Learning Details */}
            {activeTab === "insights" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-purple-400" />
                            <span>Deep Learning Architecture & Neural Vector Specs</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 text-[11px]">Model Architecture</div>
                                <div className="font-mono text-purple-300 font-semibold mt-0.5">
                                    {model_insights.model_architecture}
                                </div>
                            </div>

                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 text-[11px]">Embedding Dimensions</div>
                                <div className="font-mono text-cyan-300 font-semibold mt-0.5">
                                    {model_insights.embedding_dimensions} dense floating-point dims
                                </div>
                            </div>

                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 text-[11px]">L2 Embedding Vector Norm</div>
                                <div className="font-mono text-emerald-300 font-semibold mt-0.5">
                                    ||e||₂ = {model_insights.embedding_norm.toFixed(4)}
                                </div>
                            </div>
                        </div>

                        {/* Embedding Sample Vector Display */}
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 mb-1">
                                Sample Neural Embedding Head (First 10 Dimensions):
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-cyan-400 border border-slate-800 overflow-x-auto">
                                [{model_insights.embedding_sample_vector.join(", ")}, ...]
                            </div>
                        </div>

                        {/* Component Breakdown Table */}
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400 mb-1">
                                Methodology & Model Transparency Table:
                            </div>
                            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden text-xs">
                                {Object.entries(model_insights.components_breakdown).map(([layer, desc]) => (
                                    <div
                                        key={layer}
                                        className="p-2.5 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                                    >
                                        <span className="font-semibold text-slate-300 capitalize">
                                            {layer.replace(/_/g, " ")}
                                        </span>
                                        <span className="text-slate-400 text-[11px]">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
