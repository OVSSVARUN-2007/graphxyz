import { ArrowRight, Clock, History, Sigma, Sparkles, Trash2, X } from "lucide-react";
import React from "react";
import { HistoryItem } from "../../types/graph";

interface HistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onSelectHistory: (item: HistoryItem) => void;
    onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
    isOpen,
    onClose,
    history,
    onSelectHistory,
    onClearHistory,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-[#0f172a] border-l border-slate-700 w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-400" />
                        <h3 className="text-sm font-bold text-slate-100">Generation History ({history.length})</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {history.length > 0 && (
                            <button
                                onClick={onClearHistory}
                                title="Clear all history"
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                    {history.length === 0 ? (
                        <div className="text-center py-16 text-slate-500 space-y-2">
                            <Clock className="w-8 h-8 mx-auto text-slate-600" />
                            <p className="text-xs">No generations in history yet.</p>
                            <p className="text-[11px] text-slate-600">
                                Generated equations and texts will be saved here automatically.
                            </p>
                        </div>
                    ) : (
                        history.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    onSelectHistory(item);
                                    onClose();
                                }}
                                className="p-3 bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer group flex items-start justify-between gap-3"
                            >
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`p-1 rounded text-[10px] flex items-center gap-1 font-semibold ${
                                                item.mode === "equation"
                                                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800/40"
                                                    : "bg-purple-950 text-purple-400 border border-purple-800/40"
                                            }`}
                                        >
                                            {item.mode === "equation" ? (
                                                <Sigma className="w-3 h-3" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            <span>{item.dimension}</span>
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {new Date(item.timestamp).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>

                                    <div className="text-xs font-mono text-slate-200 truncate max-w-[280px]">
                                        {item.input}
                                    </div>

                                    <div className="text-[11px] text-slate-400 truncate">{item.resultSummary}</div>
                                </div>

                                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shrink-0 mt-1">
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
