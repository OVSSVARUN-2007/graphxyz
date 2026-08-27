import React from 'react';
import { AppMode } from '../types/graph';
import { 
  Sigma, 
  Sparkles, 
  BookOpen, 
  History, 
  Download, 
  Sun, 
  Moon, 
  Zap
} from 'lucide-react';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onOpenPresets: () => void;
  onOpenHistory: () => void;
  onOpenExport: () => void;
  theme: 'dark' | 'light';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full bg-[#070b14] rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-purple-400 bg-clip-text text-transparent">
                Graphxyz
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 tracking-wider shadow-sm">
                AI Scientific Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Intelligent Equation & Deep Learning Text-to-Graph Generator
            </p>
          </div>
        </div>

        {/* Primary Mode Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
          <button
            onClick={() => setMode('equation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
              mode === 'equation'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sigma className="w-4 h-4" />
            <span>Mode A: Equation Graph</span>
          </button>

          <button
            onClick={() => setMode('nlp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
              mode === 'nlp'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Mode B: AI Text-to-Graph</span>
          </button>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Preset Library */}
          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Explore Mathematical & AI Text Presets"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Presets</span>
          </button>

          {/* History Drawer */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="View Generation History"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Export Graph */}
          <button
            onClick={onOpenExport}
            disabled={!hasGraph}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hasGraph
                ? 'text-slate-100 bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/60 hover:scale-105 active:scale-95 shadow-sm'
                : 'text-slate-600 bg-slate-900/40 border-slate-800 cursor-not-allowed'
            }`}
            title="Export Graph Image or Raw Data"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
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
