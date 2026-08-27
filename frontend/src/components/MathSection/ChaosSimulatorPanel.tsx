import { Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { evaluateChaosSimulator } from "../../services/api";

interface ChaosSimulatorPanelProps {
    onGraphData: (data: any) => void;
    isLoading: boolean;
}

export const ChaosSimulatorPanel: React.FC<ChaosSimulatorPanelProps> = ({ onGraphData }) => {
    const [system, setSystem] = useState<string>("lorenz");
    const [sigma, setSigma] = useState<number>(10.0);
    const [rho, setRho] = useState<number>(28.0);
    const [beta, setBeta] = useState<number>(2.67);
    const [numPoints, setNumPoints] = useState<number>(5000);
    const [loading, setLoading] = useState<boolean>(false);

    const systems = [
        {
            id: "lorenz",
            title: "Lorenz Butterfly Attractor",
            desc: "The iconic Butterfly Effect system (Edward Lorenz, 1963)",
        },
        { id: "rossler", title: "Rössler Continuous Chaos", desc: "Simple 3D spiral chaos with folded band topology" },
        {
            id: "aizawa",
            title: "Aizawa Sphere-Torus Chaos",
            desc: "Hypnotic spherical chaotic attractor with central core",
        },
        {
            id: "lotka",
            title: "Lotka-Volterra Predator-Prey",
            desc: "Non-linear ecological population oscillation dynamics",
        },
    ];

    const fetchSimulation = async (sysName: string = system, s = sigma, r = rho, b = beta, pts = numPoints) => {
        setLoading(true);
        try {
            const res = await evaluateChaosSimulator(sysName, { sigma: s, rho: r, beta: b, a: 0.2, c: 5.7 }, pts, 0.01);
            onGraphData(res.data);
        } catch (err) {
            console.error("Chaos simulation failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSimulation();
    }, [system]);

    return (
        <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-rose-900/50 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
                <div>
                    <h2 className="text-base font-extrabold text-rose-100 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-rose-400" />
                        <span>Chaos Theory & Dynamical Systems Studio</span>
                    </h2>
                    <p className="text-[11px] text-rose-300/80">
                        Numerical Runge-Kutta 4 integration of chaotic differential equations
                    </p>
                </div>
            </div>

            {/* System Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {systems.map(s => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                            setSystem(s.id);
                            fetchSimulation(s.id);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                            system === s.id
                                ? "bg-rose-950/80 border-rose-500 text-rose-100 shadow-md shadow-rose-950/50"
                                : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                    >
                        <div className="font-bold text-xs">{s.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                    </button>
                ))}
            </div>

            {/* Parameter Sliders for Lorenz */}
            {system === "lorenz" && (
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <div className="flex justify-between text-xs text-rose-300 font-bold mb-1">
                            <span>Prandtl (σ):</span>
                            <span className="font-mono">{sigma.toFixed(1)}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="0.5"
                            value={sigma}
                            onChange={e => {
                                const v = parseFloat(e.target.value);
                                setSigma(v);
                                fetchSimulation(system, v, rho, beta);
                            }}
                            className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-xs text-rose-300 font-bold mb-1">
                            <span>Rayleigh (ρ):</span>
                            <span className="font-mono">{rho.toFixed(1)}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="60"
                            step="0.5"
                            value={rho}
                            onChange={e => {
                                const v = parseFloat(e.target.value);
                                setRho(v);
                                fetchSimulation(system, sigma, v, beta);
                            }}
                            className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-xs text-rose-300 font-bold mb-1">
                            <span>Geometric (β):</span>
                            <span className="font-mono">{beta.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="10"
                            step="0.1"
                            value={beta}
                            onChange={e => {
                                const v = parseFloat(e.target.value);
                                setBeta(v);
                                fetchSimulation(system, sigma, rho, v);
                            }}
                            className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                    </div>
                </div>
            )}

            {/* Trajectory Points Slider */}
            <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-300 font-bold">Trajectory RK4 Length:</span>
                <div className="flex items-center gap-2">
                    {[2000, 5000, 10000].map(pts => (
                        <button
                            key={pts}
                            type="button"
                            onClick={() => {
                                setNumPoints(pts);
                                fetchSimulation(system, sigma, rho, beta, pts);
                            }}
                            className={`px-2.5 py-1 rounded font-mono font-bold text-[11px] ${
                                numPoints === pts ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400"
                            }`}
                        >
                            {pts} steps
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
