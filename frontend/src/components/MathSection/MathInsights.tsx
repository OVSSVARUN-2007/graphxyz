import { Compass, Cpu, TrendingUp, Variable } from "lucide-react";
import React from "react";
import { MathGraphData } from "../../types/graph";

interface MathInsightsProps {
    data: MathGraphData;
}

export const MathInsights: React.FC<MathInsightsProps> = ({ data }) => {
    const meta = data.metadata;
    const stats = data.stats || {};

    const formatTypeLabel = (type: string) => {
        switch (type) {
            case "EXPLICIT_2D":
                return "2D Explicit Cartesian Function (y = f(x))";
            case "EXPLICIT_3D":
                return "3D Explicit Surface (z = f(x, y))";
            case "IMPLICIT_2D":
                return "2D Implicit Algebraic Curve (f(x, y) = 0)";
            case "IMPLICIT_3D":
                return "3D Implicit Isosurface Manifold (f(x, y, z) = 0)";
            case "POLAR":
                return "2D Polar Coordinate Curve (r = f(θ))";
            case "PARAMETRIC":
                return data.dimension === "3D" ? "3D Parametric Space Curve" : "2D Parametric Plane Curve";
            case "CONSTANT":
                return "Constant Horizontal Function";
            default:
                return type;
        }
    };

    return (
        <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>Equation Intelligence & Analytical Breakdown</span>
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    {data.dimension} VISUALIZATION
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Classification */}
                <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/80">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Mathematical Class</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-100">{formatTypeLabel(data.type)}</div>
                </div>

                {/* Variables */}
                <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/80">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                        <Variable className="w-3.5 h-3.5 text-purple-400" />
                        <span>Detected Variables</span>
                    </div>
                    <div className="text-xs text-slate-200 flex flex-wrap gap-1.5 mt-0.5">
                        {meta.independent_vars && meta.independent_vars.length > 0 && (
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300">
                                Indep: {meta.independent_vars.join(", ")}
                            </span>
                        )}
                        {meta.dependent_var && (
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-pink-300">
                                Dep: {meta.dependent_var}
                            </span>
                        )}
                        {meta.parameter_vars && (
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-amber-300">
                                Param: {meta.parameter_vars.join(", ")}
                            </span>
                        )}
                    </div>
                </div>

                {/* Analytical Stats */}
                <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/80 sm:col-span-2 lg:col-span-1">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Analytical Properties</span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono space-y-0.5">
                        {stats.derivative && (
                            <div className="truncate text-slate-200">
                                f'(x) = <span className="text-emerald-300">{stats.derivative}</span>
                            </div>
                        )}
                        {stats.z_min !== undefined && stats.z_max !== undefined && (
                            <div>
                                Z Range: [{stats.z_min.toFixed(2)}, {stats.z_max.toFixed(2)}]
                            </div>
                        )}
                        {stats.min_y !== undefined && stats.max_y !== undefined && (
                            <div>
                                Y Range: [{stats.min_y.toFixed(2)}, {stats.max_y.toFixed(2)}]
                            </div>
                        )}
                        {stats.grid_size && <div>Grid Mesh: {stats.grid_size}</div>}
                        {stats.num_points && <div>Evaluated: {stats.num_points} discrete points</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
