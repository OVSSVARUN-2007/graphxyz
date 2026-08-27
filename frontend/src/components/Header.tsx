import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Wand2,
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
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/95 backdrop-blur-2xl px-4 lg:px-8 py-3 transition-all shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3.5">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/25">
              <div className="w-full h-full bg-[#070b14] rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-purple-400 bg-clip-text text-transparent">
                  Graphxyz
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 tracking-wider shadow-sm">
                  AI Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Equation & Deep Learning Text-to-Graph Generator
              </p>
            </div>
          </div>

          {/* Theme Toggle on mobile right */}
          <button
            onClick={toggleTheme}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>

        {/* Center: Primary Mode Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-950/90 border border-slate-800/90 rounded-2xl shadow-inner w-full md:w-auto justify-center">
          <button
            onClick={() => setMode('equation')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              mode === 'equation'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sigma className="w-4 h-4" />
            <span>Mode A: Equation</span>
          </button>

          <button
            onClick={() => setMode('nlp')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              mode === 'nlp'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Mode B: AI Text Graph</span>
          </button>
        </div>

        {/* Right: Actions, Tools Dropdown, Export, Share */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Presets */}
          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Explore Presets"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Presets</span>
          </button>

          {/* History */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Generation History"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">History</span>
          </button>

          {/* Advanced Tools & 3D Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              disabled={!hasGraph}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                hasGraph
                  ? 'text-slate-200 bg-slate-900/90 hover:bg-slate-800 border-slate-700 hover:scale-105 active:scale-95 shadow-sm'
                  : 'text-slate-600 bg-slate-950 border-slate-900 cursor-not-allowed'
              }`}
              title="3D Tools, AR & Video Studio"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>3D Tools</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isToolsOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#0b1120] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpenAR();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-200 hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <div>
                    <div>Augmented Reality (AR)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Project graph on desk/floor</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpenVideo();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-200 hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors border-t border-slate-800"
                >
                  <Video className="w-4 h-4 text-purple-400" />
                  <div>
                    <div>360° Cinematic Video</div>
                    <div className="text-[10px] text-slate-400 font-normal">Record 60 FPS rotation video</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpen3DPrint();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-200 hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors border-t border-slate-800"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div>3D Print Solid Slicer</div>
                    <div className="text-[10px] text-slate-400 font-normal">Export watertight .STL for 3D print</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Export */}
          <button
            onClick={onOpenExport}
            disabled={!hasGraph}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              hasGraph
                ? 'text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/60 hover:scale-105 active:scale-95 shadow-sm'
                : 'text-slate-600 bg-slate-950 border-slate-900 cursor-not-allowed'
            }`}
            title="Export Image, Python Script, or Jupyter Notebook"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export</span>
          </button>

          {/* Share */}
          <button
            onClick={onOpenShare}
            disabled={!hasGraph}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              hasGraph
                ? 'text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-md shadow-cyan-500/30 hover:scale-105 active:scale-95'
                : 'text-slate-600 bg-slate-950 border-slate-900 cursor-not-allowed'
            }`}
            title="Share to WhatsApp, Email, Social Media"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Theme Toggle (Desktop) */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
