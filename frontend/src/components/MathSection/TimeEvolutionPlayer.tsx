import { Clock, Pause, Play, RotateCcw } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface TimeEvolutionPlayerProps {
    time: number;
    setTime: (t: number) => void;
    onTimeStep: (t: number) => void;
}

export const TimeEvolutionPlayer: React.FC<TimeEvolutionPlayerProps> = ({ time, setTime, onTimeStep }) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(1.0);
    const reqRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(performance.now());
    const currentTimeRef = useRef<number>(time);
    currentTimeRef.current = time;

    useEffect(() => {
        if (!isPlaying) {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
            return;
        }

        const loop = (now: number) => {
            const dt = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;

            let next = currentTimeRef.current + dt * speed * 1.5;
            if (next > 2 * Math.PI) next = 0;
            currentTimeRef.current = next;
            setTime(next);
            onTimeStep(next);

            reqRef.current = requestAnimationFrame(loop);
        };

        lastTimeRef.current = performance.now();
        reqRef.current = requestAnimationFrame(loop);

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, [isPlaying, speed]);

    return (
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>4D Time Evolution Player (t)</span>
                </div>
                <div className="flex items-center gap-1">
                    {[0.5, 1.0, 2.0].map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setSpeed(s)}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition-all ${
                                speed === s
                                    ? "bg-purple-600 text-white"
                                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                        isPlaying
                            ? "bg-rose-500 hover:bg-rose-400 text-white"
                            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white"
                    }`}
                >
                    {isPlaying ? (
                        <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Play (60 FPS)</span>
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setTime(0);
                        onTimeStep(0);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    title="Reset Time to 0"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1 flex items-center gap-2">
                    <input
                        type="range"
                        min="0"
                        max={2 * Math.PI}
                        step="0.05"
                        value={time}
                        onChange={e => {
                            const val = parseFloat(e.target.value);
                            setTime(val);
                            onTimeStep(val);
                        }}
                        className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono text-xs text-purple-300 font-bold w-12 text-right">
                        {time.toFixed(2)}s
                    </span>
                </div>
            </div>
        </div>
    );
};
