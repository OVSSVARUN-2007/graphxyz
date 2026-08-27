import React, { useState } from 'react';
import { Network, Dna, Play, RefreshCw, Layers } from 'lucide-react';
import { evaluateNeuralDNA } from '../../services/api';

interface NeuralDNAStudioProps {
  onCustomGraphData: (data: any) => void;
  isLoading: boolean;
}

export const NeuralDNAStudio: React.FC<NeuralDNAStudioProps> = ({
  onCustomGraphData,
  isLoading: parentLoading,
}) => {
  const [modelType, setModelType] = useState<'neural_net' | 'dna_helix'>('neural_net');
  const [layersStr, setLayersStr] = useState<string>('4, 8, 8, 3');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const presets = [
    { label: 'Deep MLP Classifier', type: 'neural_net', layers: '4, 8, 8, 3' },
    { label: 'Transformer MLP Block', type: 'neural_net', layers: '6, 12, 12, 6' },
    { label: 'DNA Double-Helix (A-T / G-C)', type: 'dna_helix', layers: '' },
  ];

  const handleGenerate = async (selectedType?: 'neural_net' | 'dna_helix', customLayersStr?: string) => {
    const type = selectedType || modelType;
    const lStr = customLayersStr !== undefined ? customLayersStr : layersStr;
    const parsedLayers = lStr
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    setIsGenerating(true);
    try {
      const res = await evaluateNeuralDNA(type, parsedLayers.length >= 2 ? parsedLayers : [4, 8, 8, 3]);
      if (res?.data) {
        onCustomGraphData(res.data);
      }
    } catch (err) {
      console.error('Neural/DNA generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-purple-800/40 bg-gradient-to-br from-[#0e061d]/90 via-[#090414]/90 to-[#1a051d]/90 space-y-4 shadow-xl shadow-purple-950/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-800/30 pb-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-purple-200 flex items-center gap-2">
            {modelType === 'neural_net' ? (
              <Network className="w-5 h-5 text-purple-400" />
            ) : (
              <Dna className="w-5 h-5 text-pink-400" />
            )}
            <span>Neural Network & Biological DNA Studio</span>
          </h2>
          <p className="text-[11px] text-purple-300/80">
            Interactive 3D architecture graph with synaptic weights and molecular bonds
          </p>
        </div>

        <div className="flex items-center p-0.5 bg-slate-900/90 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setModelType('neural_net');
              handleGenerate('neural_net');
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              modelType === 'neural_net'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Neural Net
          </button>
          <button
            type="button"
            onClick={() => {
              setModelType('dna_helix');
              handleGenerate('dna_helix');
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              modelType === 'dna_helix'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DNA Helix
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {presets.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setModelType(item.type as any);
              if (item.layers) setLayersStr(item.layers);
              handleGenerate(item.type as any, item.layers);
            }}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-purple-200 text-left transition-all"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Layer Config for Neural Net */}
      {modelType === 'neural_net' && (
        <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Layer Sizes (Input → Hidden → Output):</span>
            </span>
            <span className="text-[10px] text-slate-500">Comma-separated</span>
          </label>
          <input
            type="text"
            value={layersStr}
            onChange={(e) => setLayersStr(e.target.value)}
            placeholder="e.g. 4, 8, 8, 3"
            className="w-full bg-[#050811] text-slate-200 font-mono text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-purple-400 focus:outline-none"
          />
        </div>
      )}

      {/* Generate Action Button */}
      <button
        type="button"
        disabled={isGenerating || parentLoading}
        onClick={() => handleGenerate()}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 hover:from-purple-400 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Building 3D Model...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>Render 3D Architecture</span>
          </>
        )}
      </button>
    </div>
  );
};
