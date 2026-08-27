import { Compass, ZoomIn, ZoomOut } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { evaluateFractal } from "../../services/api";

interface FractalStudioProps {
    onGraphData: (data: any) => void;
    isLoading?: boolean;
}

export const FractalStudio: React.FC<FractalStudioProps> = ({ onGraphData }) => {
    const [fractalType, setFractalType] = useState<"mandelbrot" | "julia">("mandelbrot");
    const [zoom, setZoom] = useState<number>(1.0);
    const [centerRe, setCenterRe] = useState<number>(-0.5);
    const [centerIm, setCenterIm] = useState<number>(0.0);
    const [maxIter, setMaxIter] = useState<number>(100);
    const [juliaC, setJuliaC] = useState<[number, number]>([-0.7, 0.27015]);
    const [isRendering, setIsRendering] = useState<boolean>(false);

    const fetchFractal = useCallback(async () => {
        setIsRendering(true);
        try {
            const res = await evaluateFractal(fractalType, centerRe, centerIm, zoom, maxIter, juliaC, 120);
            onGraphData(res.data);
        } catch (err) {
            console.error("Fractal render error:", err);
        } finally {
            setIsRendering(false);
        }
    }, [fractalType, centerRe, centerIm, zoom, maxIter, juliaC, onGraphData]);

    useEffect(() => {
        fetchFractal();
    }, [fractalType, zoom, maxIter, juliaC]);

    const juliaPresets: { title: string; c: [number, number] }[] = [
        { title: "Dendrite Tree", c: [0, 1] },
        { title: "Douady Rabbit", c: [-0.123, 0.745] },
        { title: "San Marco Dragon", c: [-0.75, 0] },
        { title: "Siegel Disk", c: [-0.391, -0.587] },
        { title: "Electric Spiral", c: [-0.7, 0.27015] },
    ];

    return (
        <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-indigo-900/60 space-y-4 animate-in fade-in duration-200 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-3.5">
                <div>
                    <h2 className="text-base font-extrabold text-indigo-100 flex items-center gap-2">
                        <Compass className="w-5 h-5 text-indigo-400" />
                        <span>Fractal & Chaos Explorer (Mandelbrot & Julia Sets)</span>
                    </h2>
                    <p className="text-[11px] text-indigo-300/80">
                        Non-linear complex dynamics z(n+1) = z(n)² + c with 3D escape-time heightfields
                    </p>
                </div>

                {/* Fractal Type Switch */}
                <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
                    {(["mandelbrot", "julia"] as const).map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => {
                                setFractalType(type);
                                if (type === "mandelbrot") {
                                    setCenterRe(-0.5);
                                    setCenterIm(0.0);
                                } else {
                                    setCenterRe(0.0);
                                    setCenterIm(0.0);
                                }
                            }}
                            className={`px-3 py-1 text-xs font-bold capitalize rounded-lg transition-all ${
                                fractalType === type
                                    ? "bg-indigo-500 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            {type} Set
                        </button>
                    ))}
                </div>
            </div>

            {/* Julia Seed Presets */}
            {fractalType === "julia" && (
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Julia Complex Seed Presets ($c = a + bi$):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {juliaPresets.map(pr => (
                            <button
                                key={pr.title}
                                type="button"
                                onClick={() => setJuliaC(pr.c)}
                                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                    juliaC[0] === pr.c[0] && juliaC[1] === pr.c[1]
                                        ? "bg-indigo-500 text-white font-bold border-indigo-400 shadow-md"
                                        : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800"
                                }`}
                            >
                                {pr.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Zoom & Iteration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Zoom Factor */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-200">
                        <span>Zoom Factor:</span>
                        <span className="text-indigo-400 font-mono ml-2">{zoom.toFixed(1)}x</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setZoom(z => Math.max(0.5, z / 1.5))}
                            className="p-1.5 rounded-lg bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoom(z => Math.min(100.0, z * 1.5))}
                            className="p-1.5 rounded-lg bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoom(1.0)}
                            className="text-xs px-2 py-1 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Max Iterations */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-200">
                        <span>Escape Iterations:</span>
                        <span className="text-indigo-400 font-mono ml-2">{maxIter}</span>
                    </div>
                    <input
                        type="range"
                        min="30"
                        max="250"
                        step="10"
                        value={maxIter}
                        onChange={e => setMaxIter(parseInt(e.target.value))}
                        className="w-36 accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
};
