import { Frown, GitCommit, Meh, Smile } from "lucide-react";
import React from "react";
import { SentenceItem } from "../../types/graph";

interface SentenceTrajectoryProps {
    sentences: SentenceItem[];
    selectedSentenceIndex: number | null;
    onSelectSentence: (idx: number | null) => void;
}

export const SentenceTrajectory: React.FC<SentenceTrajectoryProps> = ({
    sentences,
    selectedSentenceIndex,
    onSelectSentence,
}) => {
    if (!sentences || sentences.length === 0) return null;

    return (
        <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <GitCommit className="w-4 h-4 text-purple-400" />
                    <span>Sentence Semantic Progression ({sentences.length} segments)</span>
                </h4>
                <span className="text-[10px] text-slate-400">Click a sentence to highlight in 2D/3D space</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sentences.map(s => {
                    const isSelected = selectedSentenceIndex === s.index;
                    const pos = s.sentiment.positive;
                    const neg = s.sentiment.negative;
                    const compound = s.sentiment.compound_score;

                    return (
                        <div
                            key={s.index}
                            onClick={() => onSelectSentence(isSelected ? null : s.index)}
                            className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                    ? "bg-purple-950/80 border-purple-500 shadow-md shadow-purple-500/20"
                                    : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-300">
                                        S{s.index}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-300 font-sans line-clamp-2">
                                        "{s.text}"
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    {compound > 0.15 ? (
                                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50">
                                            <Smile className="w-3 h-3" />
                                            <span>+{compound.toFixed(2)}</span>
                                        </span>
                                    ) : compound < -0.15 ? (
                                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/50">
                                            <Frown className="w-3 h-3" />
                                            <span>{compound.toFixed(2)}</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/50">
                                            <Meh className="w-3 h-3" />
                                            <span>Neutral</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pl-7">
                                <span className="text-purple-300 bg-purple-950/50 px-1.5 py-0.5 rounded">
                                    Topic: {s.top_topic}
                                </span>
                                <span className="font-mono">
                                    Pos: {(pos * 100).toFixed(0)}% • Neu: {(s.sentiment.neutral * 100).toFixed(0)}% •
                                    Neg: {(neg * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
