import { BookOpen, Download, History, Layers, Moon, Sigma, Sparkles, Sun } from "lucide-react";
import React from "react";
import { AppMode } from "../types/graph";

interface HeaderProps {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    onOpenPresets: () => void;
    onOpenHistory: () => void;
    onOpenExport: () => void;
    theme: "dark" | "light";
    toggleTheme: () => void;
    hasGraph: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    mode,
    setMode,
    onOpenPresets,
    onOpenHistory,
    onOpenExport,
    theme,
    toggleTheme,
    hasGraph,
}) => {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors duration-200">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Brand & Title */}
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20">
                        <div className="w-full h-full bg-[#0b0f19] rounded-[11px] flex items-center justify-center">
                            <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                                Graphx
                            </h1>
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 tracking-wider">
                                AI Scientific Studio
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 hidden sm:block">
                            Equation & Deep Learning Text-to-Graph Engine
                        </p>
                    </div>
                </div>

                {/* Primary Mode Switcher Tabs */}
                <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
                    <button
                        onClick={() => setMode("equation")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${
                            mode === "equation"
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                    >
                        <Sigma className="w-4 h-4" />
                        <span>Equation to Graph</span>
                    </button>

                    <button
                        onClick={() => setMode("nlp")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${
                            mode === "nlp"
                                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/25"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>AI Text-to-Graph</span>
                    </button>
                </div>

                {/* Global Toolbar Actions */}
                <div className="flex items-center gap-2">
                    {/* Preset Library Button */}
                    <button
                        onClick={onOpenPresets}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-colors"
                        title="Explore Preset Gallery"
                    >
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Presets</span>
                    </button>

                    {/* History Button */}
                    <button
                        onClick={onOpenHistory}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-colors"
                        title="View History"
                    >
                        <History className="w-3.5 h-3.5 text-purple-400" />
                        <span className="hidden sm:inline">History</span>
                    </button>

                    {/* Export Graph Button */}
                    <button
                        onClick={onOpenExport}
                        disabled={!hasGraph}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            hasGraph
                                ? "text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60"
                                : "text-slate-600 bg-slate-900/40 border-slate-800 cursor-not-allowed"
                        }`}
                        title="Export Graph Image or Data"
                    >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Export</span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-colors"
                        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === "dark" ? (
                            <Sun className="w-4 h-4 text-amber-400" />
                        ) : (
                            <Moon className="w-4 h-4 text-slate-300" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};
