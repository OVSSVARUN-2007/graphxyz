import React, { useState, useEffect, useCallback } from 'react';
import { Atom, Sliders, RefreshCw, Zap, Sparkles } from 'lucide-react';
import { evaluateQuantumOrbital } from '../../services/api';

interface QuantumOrbitalStudioProps {
  onGraphData: (data: any) => void;
  isLoading?: boolean;
}

export const QuantumOrbitalStudio: React.FC<QuantumOrbitalStudioProps> = ({ onGraphData }) => {
  const [n, setN] = useState<number>(2);
  const [l, setL] = useState<number>(1);
  const [m, setM] = useState<number>(0);
  const [isopercentile, setIsopercentile] = useState<number>(90);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const orbitalTypes = ['s (l=0)', 'p (l=1)', 'd (l=2)', 'f (l=3)'];

  const fetchOrbital = useCallback(async (nVal: number, lVal: number, mVal: number, iso: number) => {
    setIsSimulating(true);
    try {
      const res = await evaluateQuantumOrbital(nVal, lVal, mVal, 35, 16.0, iso);
      onGraphData(res.data);
    } catch (err) {
      console.error('Quantum Orbital Error:', err);
    } finally {
      setIsSimulating(false);
    }
  }, [onGraphData]);

  useEffect(() => {
    fetchOrbital(n, l, m, isopercentile);
  }, [fetchOrbital]);

  const handleNChange = (newN: number) => {
    setN(newN);
    const maxL = newN - 1;
    const nextL = Math.min(l, maxL);
    setL(nextL);
    const nextM = Math.max(-nextL, Math.min(nextL, m));
    setM(nextM);
    fetchOrbital(newN, nextL, nextM, isopercentile);
  };

  const handleLChange = (newL: number) => {
    setL(newL);
    const nextM = Math.max(-newL, Math.min(newL, m));
    setM(nextM);
    fetchOrbital(n, newL, nextM, isopercentile);
  };

  const handleMChange = (newM: number) => {
    setM(newM);
    fetchOrbital(n, l, newM, isopercentile);
  };

  const quickPresets = [
    { title: '1s Ground State', n: 1, l: 0, m: 0 },
    { title: '2p_z Orbital', n: 2, l: 1, m: 0 },
    { title: '3d_z² Orbital', n: 3, l: 2, m: 0 },
    { title: '3d_xy Cloverleaf', n: 3, l: 2, m: 2 },
    { title: '4f Toroidal Complex', n: 4, l: 3, m: 0 },
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-cyan-900/60 space-y-4 animate-in fade-in duration-200 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-900/40 pb-3.5">
        <div>
          <h2 className="text-base font-extrabold text-cyan-100 flex items-center gap-2">
            <Atom className="w-5 h-5 text-cyan-400 animate-spin-slow" />
            <span>Quantum Physics: Hydrogen Electron Orbitals</span>
          </h2>
          <p className="text-[11px] text-cyan-300/80">
            Schrödinger 3D wavefunctions with Laguerre radial decay & Spherical Harmonics ($Y_l^m$)
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-xs font-mono font-bold text-cyan-300">
          <span>State: |ψ({n}, {l}, {m})⟩</span>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          Quantum State Presets:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {quickPresets.map((pr) => (
            <button
              key={pr.title}
              type="button"
              onClick={() => {
                setN(pr.n);
                setL(pr.l);
                setM(pr.m);
                fetchOrbital(pr.n, pr.l, pr.m, isopercentile);
              }}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                n === pr.n && l === pr.l && m === pr.m
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {pr.title}
            </button>
          ))}
        </div>
      </div>

      {/* Quantum Number Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Principal n */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
            <span>Principal (n = {n})</span>
            <span className="text-[10px] text-cyan-400 font-mono">Shell 1 to 4</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((nVal) => (
              <button
                key={nVal}
                type="button"
                onClick={() => handleNChange(nVal)}
                className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                  n === nVal
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                n = {nVal}
              </button>
            ))}
          </div>
        </div>

        {/* Azimuthal l */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
            <span>Azimuthal (l = {l})</span>
            <span className="text-[10px] text-cyan-400 font-mono">{orbitalTypes[l]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: n }, (_, i) => i).map((lVal) => (
              <button
                key={lVal}
                type="button"
                onClick={() => handleLChange(lVal)}
                className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                  l === lVal
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                l = {lVal}
              </button>
            ))}
          </div>
        </div>

        {/* Magnetic m */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
            <span>Magnetic (m = {m})</span>
            <span className="text-[10px] text-cyan-400 font-mono">[-{l} ... +{l}]</span>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 2 * l + 1 }, (_, i) => i - l).map((mVal) => (
              <button
                key={mVal}
                type="button"
                onClick={() => handleMChange(mVal)}
                className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                  m === mVal
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mVal > 0 ? `+${mVal}` : mVal}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Iso-density slider */}
      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="text-xs font-bold text-slate-300">
          <span>Probability Density Cutoff:</span>
          <span className="text-cyan-400 font-mono ml-2">{isopercentile}% Percentile</span>
        </div>
        <input
          type="range"
          min="70"
          max="98"
          step="2"
          value={isopercentile}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setIsopercentile(val);
            fetchOrbital(n, l, m, val);
          }}
          className="w-48 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
