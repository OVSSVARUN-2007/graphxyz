import React, { useState } from 'react';
import { GitCompare, Sparkles, RefreshCw, Layers, TrendingUp, Compass } from 'lucide-react';
import { compareDualNLP } from '../../services/api';

interface DualTextComparePanelProps {
  onGraphData: (data: any) => void;
}

export const DualTextComparePanel: React.FC<DualTextComparePanelProps> = ({ onGraphData }) => {
  const [text1, setText1] = useState<string>(
    'Artificial intelligence, automated robotics, and quantum computing will accelerate technological progress and scientific discovery exponentially.'
  );
  const [text2, setText2] = useState<string>(
    'Unregulated artificial intelligence raises profound ethical risks, systemic algorithmic biases, and widespread socio-economic displacement.'
  );
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareResult, setCompareResult] = useState<any>(null);

  const handleRunComparison = async () => {
    if (!text1.trim() || !text2.trim()) return;

    setIsComparing(true);
    try {
      const res = await compareDualNLP(text1, text2, 'PCA');
      setCompareResult(res);

      const d1 = res.doc1;
      const d2 = res.doc2;

      // Plot dual sentiment trajectories and embeddings
      const trace1 = {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Doc A: Sentiment Arc',
        x: d1.sentences.map((s: any) => `A-S${s.index}`),
        y: d1.sentences.map((s: any) => s.sentiment.compound_score),
        line: { color: '#38bdf8', width: 3 },
        marker: { size: 9, color: '#38bdf8' },
      };

      const trace2 = {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Doc B: Sentiment Arc',
        x: d2.sentences.map((s: any) => `B-S${s.index}`),
        y: d2.sentences.map((s: any) => s.sentiment.compound_score),
        line: { color: '#f43f5e', width: 3 },
        marker: { size: 9, color: '#f43f5e' },
      };

      onGraphData({
        type: 'DUAL_NLP_COMPARE',
        dimension: '2D',
        title: 'Comparative Sentiment & Topic Divergence',
        metadata: {
          type: 'DUAL_NLP_COMPARE',
          dimension: '2D',
          raw: 'Document Comparison',
        },
        traces: [trace1, trace2],
      });
    } catch (err) {
      console.error('Dual NLP comparison error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-purple-900/60 space-y-4 animate-in fade-in duration-200 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-3.5">
        <div>
          <h2 className="text-base font-extrabold text-purple-100 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-400" />
            <span>Comparative NLP Manifold Studio</span>
          </h2>
          <p className="text-[11px] text-purple-300/80">
            Compare two documents side-by-side to analyze semantic divergence, sentiment shifts, and topic overlap
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunComparison}
          disabled={isComparing}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
        >
          {isComparing ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
          <span>Compare Documents</span>
        </button>
      </div>

      {/* Side-by-Side Text Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Document A */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-sky-300">
            <span>Document A (Optimistic / Viewpoint 1)</span>
            <span className="text-[10px] text-slate-400">Blue Trace</span>
          </div>
          <textarea
            rows={3}
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            className="w-full bg-[#050811] text-sky-200 text-xs p-3 rounded-xl border border-sky-900/50 focus:border-sky-400 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Document B */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-rose-300">
            <span>Document B (Critical / Viewpoint 2)</span>
            <span className="text-[10px] text-slate-400">Rose Trace</span>
          </div>
          <textarea
            rows={3}
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            className="w-full bg-[#050811] text-rose-200 text-xs p-3 rounded-xl border border-rose-900/50 focus:border-rose-400 focus:outline-none leading-relaxed"
          />
        </div>
      </div>

      {/* Comparison Summary Cards */}
      {compareResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-sky-900/50">
            <div className="text-xs font-bold text-sky-300 mb-1">Doc A Analysis:</div>
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <div>Sentiment: <b className="text-emerald-400">{compareResult.doc1.sentiment.label}</b> ({compareResult.doc1.sentiment.compound_score})</div>
              <div>Top Topic: <span className="text-sky-300">{Object.keys(compareResult.doc1.topics)[0]}</span></div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-rose-900/50">
            <div className="text-xs font-bold text-rose-300 mb-1">Doc B Analysis:</div>
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <div>Sentiment: <b className="text-rose-400">{compareResult.doc2.sentiment.label}</b> ({compareResult.doc2.sentiment.compound_score})</div>
              <div>Top Topic: <span className="text-rose-300">{Object.keys(compareResult.doc2.topics)[0]}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
