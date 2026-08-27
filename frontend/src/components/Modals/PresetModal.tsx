import { ArrowRight, BookOpen, Search, Sigma, Sparkles, X } from "lucide-react";
import React, { useState } from "react";
import { AppMode, PresetEquation, PresetText } from "../../types/graph";

interface PresetModalProps {
    isOpen: boolean;
    onClose: () => void;
    equations: PresetEquation[];
    texts: PresetText[];
    onSelectEquation: (eq: string) => void;
    onSelectText: (txt: string) => void;
    currentMode: AppMode;
}

export const PresetModal: React.FC<PresetModalProps> = ({
    isOpen,
    onClose,
    equations,
    texts,
    onSelectEquation,
    onSelectText,
    currentMode,
}) => {
    const [tab, setTab] = useState<"equations" | "texts">(currentMode === "equation" ? "equations" : "texts");
    const [search, setSearch] = useState<string>("");
    const [eqCategory, setEqCategory] = useState<string>("All");

    if (!isOpen) return null;

    const categories = ["All", ...Array.from(new Set(equations.map(e => e.category)))];

    const filteredEquations = equations.filter(e => {
        const matchesCat = eqCategory === "All" || e.category === eqCategory;
        const matchesSearch =
            e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.equation.toLowerCase().includes(search.toLowerCase()) ||
            e.description.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const filteredTexts = texts.filter(t => {
        return (
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase()) ||
            t.text.toLowerCase().includes(search.toLowerCase())
        );
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <BookOpen className="w-5 h-5 text-cyan-400" />
                        <div>
                            <h3 className="text-base font-bold text-slate-100">
                                Preset Library & Mathematical Gallery
                            </h3>
                            <p className="text-xs text-slate-400">
                                Choose from pre-configured equations or natural language texts
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab & Search Controls */}
                <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit">
                            <button
                                onClick={() => setTab("equations")}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    tab === "equations"
                                        ? "bg-cyan-500 text-slate-950 shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <Sigma className="w-3.5 h-3.5" />
                                <span>Equations ({equations.length})</span>
                            </button>

                            <button
                                onClick={() => setTab("texts")}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    tab === "texts"
                                        ? "bg-purple-500 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI Texts ({texts.length})</span>
                            </button>
                        </div>

                        {/* Search Box */}
                        <div className="relative flex-1 max-w-xs">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search presets..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 font-sans"
                            />
                        </div>
                    </div>

                    {/* Equation Category Filters */}
                    {tab === "equations" && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setEqCategory(cat)}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                                        eqCategory === cat
                                            ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold"
                                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Presets List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-2.5">
                    {tab === "equations" ? (
                        filteredEquations.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs">
                                No equations found matching your search.
                            </div>
                        ) : (
                            filteredEquations.map(eq => (
                                <div
                                    key={eq.id}
                                    onClick={() => {
                                        onSelectEquation(eq.equation);
                                        onClose();
                                    }}
                                    className="p-3.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/60 rounded-xl transition-all cursor-pointer group flex items-start justify-between gap-3"
                                >
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                                                {eq.title}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                                {eq.dimension}
                                            </span>
                                            <span className="text-[10px] text-slate-500">{eq.category}</span>
                                        </div>

                                        <div className="font-mono text-xs text-cyan-400 bg-slate-950/90 px-2.5 py-1 rounded-md border border-slate-800/80 inline-block">
                                            {eq.equation}
                                        </div>

                                        <p className="text-[11px] text-slate-400">{eq.description}</p>
                                    </div>

                                    <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shrink-0 mt-1">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            ))
                        )
                    ) : filteredTexts.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs">
                            No texts found matching your search.
                        </div>
                    ) : (
                        filteredTexts.map(txt => (
                            <div
                                key={txt.id}
                                onClick={() => {
                                    onSelectText(txt.text);
                                    onClose();
                                }}
                                className="p-3.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/60 rounded-xl transition-all cursor-pointer group flex items-start justify-between gap-3"
                            >
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                                            {txt.title}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-800/40">
                                            {txt.category}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">"{txt.text}"</p>
                                </div>

                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-purple-500 group-hover:text-white transition-all shrink-0 mt-1">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
