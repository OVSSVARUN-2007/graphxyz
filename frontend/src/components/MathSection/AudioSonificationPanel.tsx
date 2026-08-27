import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Square, Radio, Music } from 'lucide-react';

interface AudioSonificationPanelProps {
  equation: string;
  mathData?: any;
}

export const AudioSonificationPanel: React.FC<AudioSonificationPanelProps> = ({
  equation,
  mathData,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(3.0);
  const [baseFreq, setBaseFreq] = useState<number>(220); // A3 note
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopAudio = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const playSonification = () => {
    stopAudio();

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Extract y values from primary trace if available
      let yValues: number[] = [];
      if (mathData?.traces && mathData.traces[0]?.y) {
        yValues = (mathData.traces[0].y as any[]).filter((v) => typeof v === 'number' && isFinite(v));
      }

      if (yValues.length === 0) {
        // Generate fallback sine sweep
        yValues = Array.from({ length: 200 }, (_, i) => Math.sin((i / 200) * Math.PI * 4));
      }

      const minVal = Math.min(...yValues);
      const maxVal = Math.max(...yValues);
      const range = (maxVal - minVal) || 1.0;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration - 0.1);
      gain.gain.setValueAtTime(0.0, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Sweep frequency according to mathematical curve y = f(x)
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(baseFreq, now);

      yValues.forEach((val, index) => {
        const t = now + (index / yValues.length) * duration;
        // Normalize val to [baseFreq, baseFreq * 4]
        const normalized = (val - minVal) / range;
        const targetFreq = baseFreq + normalized * 600;
        osc.frequency.setValueAtTime(targetFreq, t);
      });

      osc.start(now);
      osc.stop(now + duration);
      setIsPlaying(true);

      setTimeout(() => {
        setIsPlaying(false);
      }, duration * 1000);
    } catch (err) {
      console.error('Audio sonification failed:', err);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-2.5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <Music className="w-4 h-4" />
          <span>Equation Audio Sonification (Listen to Graph)</span>
        </div>

        <button
          type="button"
          onClick={isPlaying ? stopAudio : playSonification}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-400 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Sound</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Play Equation Sound</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-amber-200/80">
        <span>Converts pitch frequency dynamically across the curve $y = f(x)$.</span>
        <span className="font-mono text-[10px] bg-amber-950 px-2 py-0.5 rounded border border-amber-800/50">
          Web Audio Synthesizer
        </span>
      </div>
    </div>
  );
};
