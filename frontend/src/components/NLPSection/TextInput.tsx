import React from 'react';
import { DimensionMode, DimReductionMethod, PresetText } from '../../types/graph';
import { Sparkles, RefreshCw, Lightbulb, Binary, Wand2, Compass } from 'lucide-react';

interface TextInputProps {
  text: string;
  setText: (text: string) => void;
  onAnalyze: (method: DimReductionMethod, dimension: DimensionMode) => void;
  isLoading: boolean;
  reductionMethod: DimReductionMethod;
  setReductionMethod: (method: DimReductionMethod) => void;
  dimensionMode: DimensionMode;
  setDimensionMode: (dim: DimensionMode) => void;
  samplePresets: PresetText[];
}

export const TextInput: React.FC<TextInputProps> = ({
  text,
  setText,
  onAnalyze,
  isLoading,
  reductionMethod,
  setReductionMethod,
  dimensionMode,
  setDimensionMode,
  samplePresets,
}) => {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter(Boolean).length : 0;

  const handleSubmit = (dimOverride?: DimensionMode, methodOverride?: DimReductionMethod) => {
    const targetDim = dimOverride || dimensionMode;
    const targetMethod = methodOverride || reductionMethod;
    if (!text.trim() || isLoading) return;
    onAnalyze(targetMethod, targetDim);
  };

  const handleDimensionClick = (dim: DimensionMode) => {
    setDimensionMode(dim);
    if (text.trim()) {
      handleSubmit(dim);
    }
  };

  const handleMethodClick = (method: DimReductionMethod) => {
    setReductionMethod(method);
    if (text.trim()) {
      handleSubmit(undefined, method);
    }
  };

  const handlePresetSelect = (presetText: string) => {
    setText(presetText);
    setTimeout(() => {
      onAnalyze(reductionMethod, dimensionMode);
    }, 50);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-slate-800 relative overflow-hidden space-y-4">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Dimension Override */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <span>Natural Language Text to Graph</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Transforms freeform text into neural manifold embeddings and sentiment arcs
          </p>
        </div>

        {/* 1D / 2D / 3D Dimension Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
          {(['AUTO', '1D', '2D', '3D'] as DimensionMode[]).map((dim) => (
            <button
              key={dim}
              type="button"
              onClick={() => handleDimensionClick(dim)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                dimensionMode === dim
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/30 scale-105'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              {dim === 'AUTO' ? 'Auto Detect' : dim}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Sample Prompts with 1-click execution */}
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Preset Prompts (Click to Load & Plot):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {samplePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.text)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-purple-950/70 hover:text-purple-200 text-slate-300 border border-slate-800 hover:border-purple-700/60 transition-all duration-150 active:scale-95 shadow-sm font-medium"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Text Area Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">
        <div className="relative">
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste any paragraph, article, emotional reflection, or research abstract here..."
            className="w-full bg-[#050811] text-purple-200 font-sans text-sm md:text-base p-4 rounded-xl border border-purple-900/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all placeholder:text-slate-600 shadow-inner leading-relaxed"
          />
          {/* Live Text Stats Counter */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-800">
            <span>{words} words</span>
            <span>•</span>
            <span>{sentences} sentences</span>
            <span>•</span>
            <span>{chars} chars</span>
          </div>
        </div>

        {/* Reduction Algorithm Selection: PCA vs t-SNE vs UMAP */}
        <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200">
                Dimensionality Reduction Manifold
              </div>
              <div className="text-[10px] text-slate-400">
                Transforms 384-dimensional Transformer vectors into 1D, 2D, or 3D space
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            {(['PCA', 'TSNE', 'UMAP'] as DimReductionMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => handleMethodClick(method)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all ${
                  reductionMethod === method
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-xl ${
              isLoading || !text.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-400 hover:to-rose-400 text-white shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Running Transformer Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Text & Generate Graph ({dimensionMode})</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
