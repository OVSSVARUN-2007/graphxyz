import React from 'react';
import {
  Sigma,
  Sparkles,
  BookOpen,
  History,
  Download,
  Share2,
  Sun,
  Moon,
  Zap,
  Smartphone,
  Video,
  Printer,
} from 'lucide-react';
import { AppMode } from '../types/graph';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onOpenPresets: () => void;
  onOpenHistory: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onOpenAR: () => void;
  onOpenVideo: () => void;
  onOpen3DPrint: () => void;
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
  onOpenShare,
  onOpenAR,
  onOpenVideo,
  onOpen3DPrint,
  theme,
  toggleTheme,
  hasGraph,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl px-3 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full bg-[#070b14] rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-purple-400 bg-clip-text text-transparent">
                Graphxyz
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 tracking-wider shadow-sm">
                AI Studio
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
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
              mode === 'equation'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sigma className="w-4 h-4" />
            <span>Mode A: Equation</span>
          </button>

          <button
            onClick={() => setMode('nlp')}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
              mode === 'nlp'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Mode B: AI Text Graph</span>
          </button>
        </div>

        {/* Action Buttons: Presets, History, Export, Share, AR, Video, 3D Print, Theme */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {/* Preset Library */}
          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Explore Presets"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Presets</span>
          </button>

          {/* History Drawer */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Generation History"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>History</span>
          </button>

          {/* Export Graph */}
          <button
            onClick={onOpenExport}
            disabled={!hasGraph}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hasGraph
                ? 'text-slate-100 bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/60 hover:scale-105 active:scale-95 shadow-sm'
                : 'text-slate-600 bg-slate-900/40 border-slate-800 cursor-not-allowed'
            }`}
            title="Export Image, Python Script, or Notebook"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export</span>
          </button>

          {/* Share Graph */}
          <button
            onClick={onOpenShare}
            disabled={!hasGraph}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hasGraph
                ? 'text-cyan-200 bg-cyan-950/70 hover:bg-cyan-900/80 border-cyan-700/60 hover:scale-105 active:scale-95 shadow-sm'
                : 'text-slate-600 bg-slate-900/40 border-slate-800 cursor-not-allowed'
            }`}
            title="Share to WhatsApp, Email, Social Media"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Share</span>
          </button>

          {/* AR Quick Look */}
          <button
            onClick={onOpenAR}
            disabled={!hasGraph}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hasGraph
                ? 'text-sky-200 bg-sky-950/60 hover:bg-sky-900/80 border-sky-700/60 hover:scale-105 active:scale-95 shadow-sm'
                : 'text-slate-600 bg-slate-900/40 border-slate-800 cursor-not-allowed'
            }`}
            title="Augmented Reality (AR) & 3D WebXR Quick-Look"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>AR</span>
          </button>

          {/* 360 Video */}
          <button
            onClick={onOpenVideo}
            disabled={!hasGraph}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hasGraph
                ? 'text-purple-200 bg-purple-950/60 hover:bg-purple-900/80 border-purple-700/60 hover:scale-105 active:scale-95 shadow-sm'
                : 'text-slate-600 bg-slate-900/40 border-slate-800 cursor-not-allowed'
            }`}
            title="360° Turntable Video & GIF Capture"
          >
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>Video</span>
          </button>

          {/* 3D Print STL */}
          <button
            onClick={onOpen3DPrint}
            disabled={!hasGraph}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hasGraph
                ? 'text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/60 hover:scale-105 active:scale-95 shadow-sm'
                : 'text-slate-600 bg-slate-900/40 border-slate-800 cursor-not-allowed'
            }`}
            title="3D Print Solid Slicer (.STL)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Print</span>
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
