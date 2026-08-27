import { RotateCcw, Sliders } from "lucide-react";
import React from "react";

interface DynamicParametersPanelProps {
    parameters: Record<string, number>;
    onChangeParameter: (name: string, value: number) => void;
    onResetParameters: () => void;
}

export const DynamicParametersPanel: React.FC<DynamicParametersPanelProps> = ({
    parameters,
    onChangeParameter,
    onResetParameters,
}) => {
    const paramNames = Object.keys(parameters);

    if (paramNames.length === 0) return null;

    return (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">Interactive Parameter Sliders</span>
                </div>
                <button
                    type="button"
                    onClick={onResetParameters}
                    className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paramNames.map(name => {
                    const val = parameters[name] ?? 1.0;
                    return (
                        <div key={name} className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-mono font-bold text-cyan-300">{name}</span>
                                <span className="font-mono text-xs text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded">
                                    {val.toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-10"
                                max="10"
                                step="0.1"
                                value={val}
                                onChange={e => onChangeParameter(name, parseFloat(e.target.value))}
                                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
