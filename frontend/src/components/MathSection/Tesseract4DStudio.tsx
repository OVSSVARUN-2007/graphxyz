import { Box, Compass, Pause, Play } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { evaluate4DTesseract } from "../../services/api";

interface Tesseract4DStudioProps {
    onGraphData: (data: any) => void;
    isLoading: boolean;
}

export const Tesseract4DStudio: React.FC<Tesseract4DStudioProps> = ({ onGraphData }) => {
    const [angleXW, setAngleXW] = useState<number>(0.5);
    const [angleYW, setAngleYW] = useState<number>(0.3);
    const [angleZW, setAngleZW] = useState<number>(0.2);
    const [distance, setDistance] = useState<number>(3.0);
    const [isRotating, setIsRotating] = useState<boolean>(true);
    const reqRef = useRef<number | null>(null);

    const fetchTesseract = async (xw: number, yw: number, zw: number, dist: number) => {
        try {
            const res = await evaluate4DTesseract({ xw, yw, zw }, dist);
            onGraphData(res.data);
        } catch (err) {
            console.error("Tesseract error:", err);
        }
    };

    useEffect(() => {
        fetchTesseract(angleXW, angleYW, angleZW, distance);
    }, []);

    useEffect(() => {
        if (!isRotating) {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
            return;
        }

        let xw = angleXW;
        let yw = angleYW;
        let zw = angleZW;
        let last = performance.now();

        const loop = (now: number) => {
            const dt = (now - last) / 1000;
            last = now;
            xw += dt * 0.4;
            yw += dt * 0.25;
            zw += dt * 0.15;
            setAngleXW(xw);
            setAngleYW(yw);
            setAngleZW(zw);
            fetchTesseract(xw, yw, zw, distance);
            reqRef.current = requestAnimationFrame(loop);
        };

        reqRef.current = requestAnimationFrame(loop);
        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, [isRotating, distance]);

    return (
        <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-purple-800/50 space-y-4 animate-in fade-in duration-200 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-purple-800/40 pb-3">
                <div>
                    <h2 className="text-base font-extrabold text-purple-100 flex items-center gap-2">
                        <Box className="w-4 h-4 text-purple-400" />
                        <span>4D Hypercube (Tesseract) Studio</span>
                    </h2>
                    <p className="text-[11px] text-purple-300/80">
                        Real-time 4D space rotation projected stereographically into 3D
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsRotating(!isRotating)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                        isRotating
                            ? "bg-rose-500 hover:bg-rose-400 text-white"
                            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 text-white"
                    }`}
                >
                    {isRotating ? (
                        <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause 4D Spin</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Spin 4D Hypercube</span>
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/50">
                    <div className="flex items-center justify-between text-xs mb-1 text-purple-200">
                        <span className="font-bold">Rotation X-W Plane:</span>
                        <span className="font-mono text-purple-300 font-bold">{angleXW.toFixed(2)} rad</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={2 * Math.PI}
                        step="0.05"
                        value={angleXW % (2 * Math.PI)}
                        onChange={e => {
                            const val = parseFloat(e.target.value);
                            setAngleXW(val);
                            fetchTesseract(val, angleYW, angleZW, distance);
                        }}
                        className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                </div>

                <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/50">
                    <div className="flex items-center justify-between text-xs mb-1 text-purple-200">
                        <span className="font-bold">Rotation Y-W Plane:</span>
                        <span className="font-mono text-purple-300 font-bold">{angleYW.toFixed(2)} rad</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={2 * Math.PI}
                        step="0.05"
                        value={angleYW % (2 * Math.PI)}
                        onChange={e => {
                            const val = parseFloat(e.target.value);
                            setAngleYW(val);
                            fetchTesseract(angleXW, val, angleZW, distance);
                        }}
                        className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                </div>

                <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/50">
                    <div className="flex items-center justify-between text-xs mb-1 text-purple-200">
                        <span className="font-bold">Rotation Z-W Plane:</span>
                        <span className="font-mono text-purple-300 font-bold">{angleZW.toFixed(2)} rad</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={2 * Math.PI}
                        step="0.05"
                        value={angleZW % (2 * Math.PI)}
                        onChange={e => {
                            const val = parseFloat(e.target.value);
                            setAngleZW(val);
                            fetchTesseract(angleXW, angleYW, val, distance);
                        }}
                        className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                    <strong>4D Geometry:</strong> 16 Vertices in 4-space rotated through SO(4) rotation planes and
                    projected into 3D. The corner node colors indicate their 4th dimensional (W) coordinate.
                </span>
            </div>
        </div>
    );
};
