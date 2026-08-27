import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { DimensionMode } from '../../types/graph';
import { LaTeXToolbar } from './LaTeXToolbar';
import { Play, Sliders, RefreshCw, AlertCircle, Eye } from 'lucide-react';

interface EquationInputProps {
  equation: string;
  setEquation: (eq: string) => void;
  onGenerate: (ranges?: Record<string, [number, number]>, res?: number, dimOverride?: DimensionMode) => void;
  isLoading: boolean;
  dimensionMode: DimensionMode;
  setDimensionMode: (dim: DimensionMode) => void;
}

export const EquationInput: React.FC<EquationInputProps> = ({
  equation,
  setEquation,
  onGenerate,
  isLoading,
  dimensionMode,
  setDimensionMode,
}) => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [katexError, setKatexError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Domain ranges
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-10);
  const [yMax, setYMax] = useState<number>(10);
  const [zMin, setZMin] = useState<number>(-10);
  const [zMax, setZMax] = useState<number>(10);
  const [resolution, setResolution] = useState<number>(200);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Real-time KaTeX rendering
  useEffect(() => {
    if (!equation.trim()) {
      setPreviewHtml('');
      setKatexError(null);
      return;
    }

    try {
      const html = katex.renderToString(equation.trim(), {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      });
      setPreviewHtml(html);
      setKatexError(null);
    } catch (err: any) {
      setKatexError(err.message || 'LaTeX rendering error');
    }
  }, [equation]);

  const handleInsertSnippet = (snippet: string) => {
    if (!inputRef.current) {
      setEquation(equation + snippet);
      return;
    }
    const textarea = inputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const updated = current.substring(0, start) + snippet + current.substring(end);
    setEquation(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 10);
  };

  const handleSubmit = (dimOverride?: DimensionMode) => {
    const targetDim = dimOverride || dimensionMode;
    const ranges: Record<string, [number, number]> = {
      x: [xMin, xMax],
      y: [yMin, yMax],
      z: [zMin, zMax],
      t: [0, 2 * Math.PI],
      theta: [0, 2 * Math.PI],
    };
    onGenerate(ranges, resolution, targetDim);
  };

  const handleDimensionClick = (dim: DimensionMode) => {
    setDimensionMode(dim);
    if (equation.trim()) {
      handleSubmit(dim);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-slate-800 relative overflow-hidden space-y-4">
      {/* Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Dimension Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <span>Mathematical Equation Editor</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Type algebraic equations, LaTeX formulas, polar, or parametric forms
          </p>
        </div>

        {/* 1D / 2D / 3D Dimension Selector Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
          {(['AUTO', '1D', '2D', '3D'] as DimensionMode[]).map((dim) => (
            <button
              key={dim}
              type="button"
              onClick={() => handleDimensionClick(dim)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                dimensionMode === dim
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              {dim === 'AUTO' ? 'Auto Detect' : dim}
            </button>
          ))}
        </div>
      </div>

      {/* LaTeX Quick Insertion Bar */}
      <LaTeXToolbar onInsert={handleInsertSnippet} />

      {/* Equation Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={3}
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. y = x^2 - 4x + 3  or  z = \sin(x)\cos(y)  or  x^2 + y^2 = 25  or  r = 2\sin(3\theta)"
            className="w-full bg-[#050811] text-cyan-300 font-mono text-base md:text-lg p-3.5 rounded-xl border border-cyan-900/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all placeholder:text-slate-600 shadow-inner"
          />
          <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-mono">
            Ctrl + Enter to plot
          </div>
        </div>

        {/* Live KaTeX Rendered Preview */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 min-h-[58px] flex flex-col justify-center">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Live LaTeX Preview</span>
            {equation && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Rendered with KaTeX
              </span>
            )}
          </div>
          {previewHtml ? (
            <div
              className="text-slate-100 text-base md:text-lg py-0.5 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <div className="text-slate-600 text-xs italic text-center py-1">
              Preview will appear here in real time...
            </div>
          )}
          {katexError && (
            <div className="mt-1 text-xs text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{katexError}</span>
            </div>
          )}
        </div>

        {/* Advanced Settings Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Domain Ranges & Mesh Settings' : 'Custom Domain Ranges & Resolution'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  X Domain [Min, Max]
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={xMin}
                    onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                  <span className="text-slate-500 text-xs">to</span>
                  <input
                    type="number"
                    value={xMax}
                    onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  Y Domain [Min, Max]
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={yMin}
                    onChange={(e) => setYMin(parseFloat(e.target.value) || -10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                  <span className="text-slate-500 text-xs">to</span>
                  <input
                    type="number"
                    value={yMax}
                    onChange={(e) => setYMax(parseFloat(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  Z Domain [Min, Max]
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={zMin}
                    onChange={(e) => setZMin(parseFloat(e.target.value) || -10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                  <span className="text-slate-500 text-xs">to</span>
                  <input
                    type="number"
                    value={zMax}
                    onChange={(e) => setZMax(parseFloat(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Sampling Density:</span>
                  <span className="text-cyan-400 font-mono">{resolution} pts</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="25"
                  value={resolution}
                  onChange={(e) => setResolution(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !equation.trim()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-xl ${
              isLoading || !equation.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Evaluating Equation...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Generate Graph ({dimensionMode})</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
