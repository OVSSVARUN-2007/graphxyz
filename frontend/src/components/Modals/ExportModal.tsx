import { Check, Copy, Download, FileCode, Image as ImageIcon, X } from "lucide-react";
import Plotly from "plotly.js-dist-min";
import React, { useState } from "react";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    mathData: any;
    nlpData: any;
    currentEquation: string;
    currentText: string;
    mode: "equation" | "nlp";
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
    const [copied, setCopied] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleDownloadImage = async (format: "png" | "svg", scale: number = 2) => {
        const plotEl = document.querySelector(".js-plotly-plot") as any;
        if (!plotEl) {
            alert("No active plot to export.");
            return;
        }

        try {
            const url = await Plotly.toImage(plotEl, {
                format,
                width: 1400,
                height: 900,
                scale,
            });
            const a = document.createElement("a");
            a.href = url;
            a.download = `graphx_${mode}_export.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error("Error downloading plot image:", err);
        }
    };

    const handleDownloadJSON = () => {
        const dataToExport = mode === "equation" ? mathData : nlpData;
        const jsonStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `graphx_${mode}_data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCopyInput = () => {
        const textToCopy = mode === "equation" ? currentEquation : currentText;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-sm font-bold text-slate-100">Export Visualization & Data</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Options */}
                <div className="p-5 space-y-3">
                    {/* PNG High-Res */}
                    <button
                        onClick={() => handleDownloadImage("png", 2)}
                        className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 text-left transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                                <ImageIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-200">High-Resolution PNG Image (2K)</div>
                                <div className="text-[11px] text-slate-400">
                                    Export 2D/3D plot snapshot for publications
                                </div>
                            </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* SVG Vector */}
                    <button
                        onClick={() => handleDownloadImage("svg", 1)}
                        className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between gap-3 text-left transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                                <FileCode className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-200">Scalable Vector Graphic (SVG)</div>
                                <div className="text-[11px] text-slate-400">
                                    Lossless vector format for posters & papers
                                </div>
                            </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Raw JSON Data */}
                    <button
                        onClick={handleDownloadJSON}
                        className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-purple-500/50 flex items-center justify-between gap-3 text-left transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/40">
                                <FileCode className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-200">
                                    Structured JSON Coordinates & Metrics
                                </div>
                                <div className="text-[11px] text-slate-400">
                                    Numerical traces, mesh vertices, and embeddings
                                </div>
                            </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Copy Raw Input / LaTeX */}
                    <button
                        onClick={handleCopyInput}
                        className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/50 flex items-center justify-between gap-3 text-left transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/40">
                                <Copy className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-200">
                                    {mode === "equation" ? "Copy Equation / LaTeX" : "Copy Natural Language Text"}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
                                    {mode === "equation" ? currentEquation : currentText.slice(0, 40) + "..."}
                                </div>
                            </div>
                        </div>
                        {copied ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
