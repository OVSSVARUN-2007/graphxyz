import React, { useState } from 'react';
import { Box, Smartphone, X, Download, QrCode, Sparkles, Check, Copy } from 'lucide-react';

interface ARViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mathData: any;
  currentEquation: string;
}

export const ARViewerModal: React.FC<ARViewerModalProps> = ({
  isOpen,
  onClose,
  mathData,
  currentEquation,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleDownloadOBJ = () => {
    // Generate simple OBJ text from 3D traces
    let objContent = `# Graphxyz 3D Augmented Reality Model\n# Equation: ${currentEquation}\n`;
    const traces = mathData?.traces || [];

    let vertexOffset = 1;
    traces.forEach((trace: any, tIdx: number) => {
      objContent += `o Trace_${tIdx + 1}\n`;
      if (trace.x && trace.y && trace.z) {
        if (Array.isArray(trace.z[0])) {
          // 2D surface grid
          const rows = trace.z.length;
          const cols = trace.z[0].length;
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
              const xVal = Array.isArray(trace.x[0]) ? trace.x[i][j] : trace.x[j] || 0;
              const yVal = Array.isArray(trace.y[0]) ? trace.y[i][j] : trace.y[i] || 0;
              const zVal = trace.z[i][j] || 0;
              objContent += `v ${xVal} ${yVal} ${zVal}\n`;
            }
          }
          for (let i = 0; i < rows - 1; i++) {
            for (let j = 0; j < cols - 1; j++) {
              const v1 = vertexOffset + i * cols + j;
              const v2 = vertexOffset + i * cols + (j + 1);
              const v3 = vertexOffset + (i + 1) * cols + (j + 1);
              const v4 = vertexOffset + (i + 1) * cols + j;
              objContent += `f ${v1} ${v2} ${v3}\n`;
              objContent += `f ${v1} ${v3} ${v4}\n`;
            }
          }
          vertexOffset += rows * cols;
        } else {
          // Line/points
          for (let i = 0; i < trace.x.length; i++) {
            objContent += `v ${trace.x[i] || 0} ${trace.y[i] || 0} ${trace.z[i] || 0}\n`;
          }
          vertexOffset += trace.x.length;
        }
      }
    });

    const blob = new Blob([objContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `graphxyz_ar_model.obj`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyMobileLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0b1120] border border-cyan-700/60 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Augmented Reality (AR) & 3D Spatial Viewer</h3>
              <p className="text-[11px] text-slate-400">Project mathematical graphs onto physical desks and floors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Card visual */}
          <div className="p-4 bg-gradient-to-br from-cyan-950/40 via-blue-950/40 to-purple-950/40 rounded-xl border border-cyan-800/50 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-600/60 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
              <Box className="w-7 h-7 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-cyan-200">1:1 Scale Spatial Projection</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                View 3D surfaces, Quantum orbitals, and 4D rotations in Augmented Reality using iOS AR Quick Look or Android WebXR.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2.5">
            {/* Download 3D AR Model */}
            <button
              type="button"
              onClick={handleDownloadOBJ}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all"
            >
              <Download className="w-4 h-4 fill-slate-950" />
              <span>Download 3D AR Model (.OBJ / CAD)</span>
            </button>

            {/* Copy Mobile AR Link */}
            <button
              type="button"
              onClick={handleCopyMobileLink}
              className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>Open on Phone for Camera AR</span>
              </div>
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            💡 <b>AR Tip:</b> Open this link in Safari on iPhone or Chrome on Android to place the 3D graph in real space.
          </div>
        </div>
      </div>
    </div>
  );
};
