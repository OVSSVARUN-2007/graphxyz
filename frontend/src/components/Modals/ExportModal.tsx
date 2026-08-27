import React, { useState } from 'react';
import {
  Download,
  Image as ImageIcon,
  FileCode,
  Copy,
  Check,
  X,
  BookOpen,
  Terminal,
  Share2,
  FileText,
} from 'lucide-react';
import Plotly from 'plotly.js-dist-min';
import { exportCode, exportTikZ } from '../../services/api';
import { encodeShareableUrl } from '../../utils/shareableState';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mathData: any;
  nlpData: any;
  currentEquation: string;
  currentText: string;
  mode: 'equation' | 'nlp';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  mathData,
  nlpData,
  currentEquation,
  currentText,
  mode,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedInput, setCopiedInput] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadImage = async (format: 'png' | 'svg', scale: number = 2) => {
    const plotEl = document.querySelector('.js-plotly-plot') as any;
    if (!plotEl) {
      alert('No active plot to export.');
      return;
    }

    try {
      const url = await Plotly.toImage(plotEl, {
        format,
        width: 1600,
        height: 1000,
        scale,
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `graphxyz_${mode}_export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading plot image:', err);
    }
  };

  const handleDownloadPythonScript = async () => {
    setIsExporting(true);
    try {
      const res = await exportCode(currentEquation, mathData?.dimension || '3D');
      const blob = new Blob([res.python_code], { type: 'text/x-python' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'graphxyz_plot.py';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed downloading python script:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJupyterNotebook = async () => {
    setIsExporting(true);
    try {
      const res = await exportCode(currentEquation, mathData?.dimension || '3D');
      const jsonStr = JSON.stringify(res.jupyter_notebook, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/x-ipynb+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'graphxyz_notebook.ipynb';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed downloading jupyter notebook:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTikZ = async () => {
    setIsExporting(true);
    try {
      const res = await exportTikZ(currentEquation);
      const blob = new Blob([res.tikz_code], { type: 'text/x-tex' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'graphxyz_figure.tex';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed downloading TikZ code:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJSON = () => {
    const dataToExport = mode === 'equation' ? mathData : nlpData;
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphxyz_${mode}_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyShareLink = () => {
    const shareUrl = encodeShareableUrl({
      mode,
      equation: currentEquation,
      dimension: mathData?.dimension || 'AUTO',
      text: currentText,
    });
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Export & Share Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-4 md:p-5 space-y-2.5 overflow-y-auto custom-scrollbar">
          {/* Shareable URL Link */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between gap-3 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40 group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Copy 1-Click Shareable Link</div>
                <div className="text-[11px] text-slate-400">
                  Compressed URL hash preserving entire session state & equations
                </div>
              </div>
            </div>
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Standalone Python Script */}
          {mode === 'equation' && (
            <button
              type="button"
              onClick={handleDownloadPythonScript}
              disabled={isExporting}
              className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-blue-500/50 flex items-center justify-between gap-3 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/40 group-hover:scale-105 transition-transform">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Download Python Script (.py)</div>
                  <div className="text-[11px] text-slate-400">
                    Standalone offline NumPy + Plotly reproduction script
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Jupyter Notebook */}
          {mode === 'equation' && (
            <button
              type="button"
              onClick={handleDownloadJupyterNotebook}
              disabled={isExporting}
              className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/50 flex items-center justify-between gap-3 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/40 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Download Jupyter Notebook (.ipynb)</div>
                  <div className="text-[11px] text-slate-400">
                    Interactive Python notebook for Google Colab / JupyterLab
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* LaTeX TikZ Code */}
          {mode === 'equation' && (
            <button
              type="button"
              onClick={handleDownloadTikZ}
              disabled={isExporting}
              className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">LaTeX TikZ / PGFPlots Code (.tex)</div>
                  <div className="text-[11px] text-slate-400">
                    Publication-ready vector code for Overleaf & IEEE/arXiv papers
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* PNG High-Res */}
          <button
            type="button"
            onClick={() => handleDownloadImage('png', 2)}
            className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-purple-500/50 flex items-center justify-between gap-3 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/40 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">High-Resolution PNG Snapshot (2K)</div>
                <div className="text-[11px] text-slate-400">
                  Crisp 2D/3D visual graphic snapshot
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400" />
          </button>

          {/* SVG Vector */}
          <button
            type="button"
            onClick={() => handleDownloadImage('svg', 1)}
            className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-rose-500/50 flex items-center justify-between gap-3 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-800/40 group-hover:scale-105 transition-transform">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Scalable Vector Graphic (SVG)</div>
                <div className="text-[11px] text-slate-400">
                  Lossless vector graphic for infinite scaling
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400" />
          </button>

          {/* Raw JSON Data */}
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-600 flex items-center justify-between gap-3 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 group-hover:scale-105 transition-transform">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Structured JSON Data</div>
                <div className="text-[11px] text-slate-400">
                  Raw numerical arrays, mesh faces, vertices, and embeddings
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
