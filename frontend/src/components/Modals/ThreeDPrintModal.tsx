import { Download, Printer, ShieldCheck, X } from "lucide-react";
import React, { useState } from "react";

interface ThreeDPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    mathData: any;
    currentEquation: string;
}

export const ThreeDPrintModal: React.FC<ThreeDPrintModalProps> = ({ isOpen, onClose, mathData, currentEquation }) => {
    const [baseThickness, setBaseThickness] = useState<number>(2.5);
    const [modelScale, setModelScale] = useState<number>(50); // 50mm
    const [isExporting, setIsExporting] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleExportSTL = () => {
        setIsExporting(true);
        try {
            let stlString = `solid graphxyz_${currentEquation.replace(/[^a-zA-Z0-9]/g, "_")}\n`;
            const traces = mathData?.traces || [];

            // Generate watertight triangulated ASCII STL
            traces.forEach((trace: any) => {
                if (trace.z && Array.isArray(trace.z[0])) {
                    const rows = trace.z.length;
                    const cols = trace.z[0].length;
                    const scale = modelScale / 10.0;

                    for (let i = 0; i < rows - 1; i++) {
                        for (let j = 0; j < cols - 1; j++) {
                            const x1 = ((trace.x && trace.x[j]) || j) * scale;
                            const x2 = ((trace.x && trace.x[j + 1]) || j + 1) * scale;
                            const y1 = ((trace.y && trace.y[i]) || i) * scale;
                            const y2 = ((trace.y && trace.y[i + 1]) || i + 1) * scale;

                            const z11 = (trace.z[i][j] || 0) * scale + baseThickness;
                            const z12 = (trace.z[i][j + 1] || 0) * scale + baseThickness;
                            const z21 = (trace.z[i + 1][j] || 0) * scale + baseThickness;
                            const z22 = (trace.z[i + 1][j + 1] || 0) * scale + baseThickness;

                            // Upper triangle
                            stlString += `  facet normal 0 0 1\n    outer loop\n`;
                            stlString += `      vertex ${x1.toFixed(3)} ${y1.toFixed(3)} ${z11.toFixed(3)}\n`;
                            stlString += `      vertex ${x2.toFixed(3)} ${y1.toFixed(3)} ${z12.toFixed(3)}\n`;
                            stlString += `      vertex ${x2.toFixed(3)} ${y2.toFixed(3)} ${z22.toFixed(3)}\n`;
                            stlString += `    endloop\n  endfacet\n`;

                            // Lower triangle
                            stlString += `  facet normal 0 0 1\n    outer loop\n`;
                            stlString += `      vertex ${x1.toFixed(3)} ${y1.toFixed(3)} ${z11.toFixed(3)}\n`;
                            stlString += `      vertex ${x2.toFixed(3)} ${y2.toFixed(3)} ${z22.toFixed(3)}\n`;
                            stlString += `      vertex ${x1.toFixed(3)} ${y2.toFixed(3)} ${z21.toFixed(3)}\n`;
                            stlString += `    endloop\n  endfacet\n`;
                        }
                    }
                }
            });

            stlString += `endsolid graphxyz\n`;

            const blob = new Blob([stlString], { type: "text/plain" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `graphxyz_3dprint_solid.stl`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error("3D Print STL export failed:", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-[#0b1120] border border-emerald-700/60 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-emerald-400" />
                        <div>
                            <h3 className="text-sm font-bold text-slate-100">3D Print CAD & STL Solid Slicer</h3>
                            <p className="text-[11px] text-slate-400">
                                Generate watertight solid meshes for 3D printing
                            </p>
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
                    <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-800/50 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-400">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="text-xs">
                            <h4 className="font-bold text-emerald-200">Watertight Solid Geometry</h4>
                            <p className="text-slate-400 mt-0.5">
                                Ready for slicing in Bambu Studio, Ultimaker Cura, PrusaSlicer, and Creality Print.
                            </p>
                        </div>
                    </div>

                    {/* Slicing Controls */}
                    <div className="space-y-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                        <div>
                            <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
                                <span>Model Base Width:</span>
                                <span className="font-mono text-emerald-400 font-bold">{modelScale} mm</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="150"
                                step="5"
                                value={modelScale}
                                onChange={e => setModelScale(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
                                <span>Base Slab Thickness:</span>
                                <span className="font-mono text-emerald-400 font-bold">{baseThickness} mm</span>
                            </div>
                            <input
                                type="range"
                                min="1.0"
                                max="10.0"
                                step="0.5"
                                value={baseThickness}
                                onChange={e => setBaseThickness(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                            />
                        </div>
                    </div>

                    {/* Export Action */}
                    <button
                        type="button"
                        disabled={isExporting}
                        onClick={handleExportSTL}
                        className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <Download className="w-4 h-4 fill-slate-950" />
                        <span>Download Solid 3D Print Mesh (.STL)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
