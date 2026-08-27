import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Play, Pause, Compass } from 'lucide-react';

interface Tesseract4DStudioProps {
  onGraphData: (data: any) => void;
  isLoading?: boolean;
}

// 16 4D unit vertices in {-1, 1}^4
const VERTICES_4D: number[][] = [];
for (const x of [-1, 1]) {
  for (const y of [-1, 1]) {
    for (const z of [-1, 1]) {
      for (const w of [-1, 1]) {
        VERTICES_4D.push([x, y, z, w]);
      }
    }
  }
}

// Compute 32 hypercube edges once
const EDGE_PAIRS: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    const dist =
      Math.abs(VERTICES_4D[i][0] - VERTICES_4D[j][0]) +
      Math.abs(VERTICES_4D[i][1] - VERTICES_4D[j][1]) +
      Math.abs(VERTICES_4D[i][2] - VERTICES_4D[j][2]) +
      Math.abs(VERTICES_4D[i][3] - VERTICES_4D[j][3]);
    if (dist === 2) {
      EDGE_PAIRS.push([i, j]);
    }
  }
}

export const computeTesseractLocal = (
  xw: number,
  yw: number,
  zw: number,
  distance: number = 3.0
) => {
  const cosXW = Math.cos(xw), sinXW = Math.sin(xw);
  const cosYW = Math.cos(yw), sinYW = Math.sin(yw);
  const cosZW = Math.cos(zw), sinZW = Math.sin(zw);

  const rotated: number[][] = VERTICES_4D.map(([x0, y0, z0, w0]) => {
    // XW rotation
    const x1 = x0 * cosXW - w0 * sinXW;
    const y1 = y0;
    const z1 = z0;
    const w1 = x0 * sinXW + w0 * cosXW;

    // YW rotation
    const x2 = x1;
    const y2 = y1 * cosYW - w1 * sinYW;
    const z2 = z1;
    const w2 = y1 * sinYW + w1 * cosYW;

    // ZW rotation
    const x3 = x2;
    const y3 = y2;
    const z3 = z2 * cosZW - w2 * sinZW;
    const w3 = z2 * sinZW + w2 * cosZW;

    return [x3, y3, z3, w3];
  });

  // Perspective 4D to 3D projection
  const projected3D: number[][] = rotated.map(([x, y, z, w]) => {
    const scale = distance / (distance - w * 0.7);
    return [x * scale, y * scale, z * scale];
  });

  const edgeX: (number | null)[] = [];
  const edgeY: (number | null)[] = [];
  const edgeZ: (number | null)[] = [];

  for (const [i, j] of EDGE_PAIRS) {
    edgeX.push(projected3D[i][0], projected3D[j][0], null);
    edgeY.push(projected3D[i][1], projected3D[j][1], null);
    edgeZ.push(projected3D[i][2], projected3D[j][2], null);
  }

  return {
    type: '4D_TESSERACT',
    dimension: '3D',
    title: '4D Tesseract Hypercube (Perspective 4D->3D Projection)',
    metadata: {
      type: '4D_TESSERACT',
      dimension: '3D',
      raw: '4D Tesseract Hypercube (SO(4) Projection)',
      normalized: '4D Tesseract Hypercube (SO(4) Projection)',
      independent_vars: ['X', 'Y', 'Z', 'W'],
      dependent_var: 'Projection(3D)',
      variables: ['X', 'Y', 'Z', 'W'],
      detected_parameters: ['xw', 'yw', 'zw'],
      has_time_parameter: false,
    },
    traces: [
      {
        type: 'scatter3d',
        mode: 'lines',
        name: '4D Hypercube Edges (32 Edges)',
        x: edgeX,
        y: edgeY,
        z: edgeZ,
        line: { color: '#38bdf8', width: 4 },
      },
      {
        type: 'scatter3d',
        mode: 'markers',
        name: '4D Vertices (16 Corners)',
        x: projected3D.map((p) => p[0]),
        y: projected3D.map((p) => p[1]),
        z: projected3D.map((p) => p[2]),
        marker: {
          size: 6,
          color: rotated.map((r) => r[3]),
          colorscale: 'Plasma',
          showscale: true,
          colorbar: { title: '4th Dim (W)' },
        },
      },
    ],
    stats: {
      vertices: 16,
      edges: 32,
      rotation_xw: xw,
      rotation_yw: yw,
      rotation_zw: zw,
    },
  };
};

export const Tesseract4DStudio: React.FC<Tesseract4DStudioProps> = ({ onGraphData }) => {
  const [angleXW, setAngleXW] = useState<number>(0.5);
  const [angleYW, setAngleYW] = useState<number>(0.3);
  const [angleZW, setAngleZW] = useState<number>(0.2);
  const [distance, setDistance] = useState<number>(3.0);
  const [isRotating, setIsRotating] = useState<boolean>(true);

  const angleRef = useRef({ xw: 0.5, yw: 0.3, zw: 0.2 });
  const reqRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastRenderTimeRef = useRef<number>(0);

  const updateGraph = useCallback(
    (xw: number, yw: number, zw: number, dist: number) => {
      const data = computeTesseractLocal(xw, yw, zw, dist);
      onGraphData(data);
    },
    [onGraphData]
  );

  // Initial draw
  useEffect(() => {
    updateGraph(angleXW, angleYW, angleZW, distance);
  }, [updateGraph]);

  // Smooth 30 FPS Render Loop without flooding React state or Network
  useEffect(() => {
    if (!isRotating) {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Increment rotation angles
      angleRef.current.xw += dt * 0.45;
      angleRef.current.yw += dt * 0.30;
      angleRef.current.zw += dt * 0.18;

      // Throttle canvas draw to 30 FPS for optimal performance
      if (now - lastRenderTimeRef.current >= 33) {
        lastRenderTimeRef.current = now;
        updateGraph(
          angleRef.current.xw,
          angleRef.current.yw,
          angleRef.current.zw,
          distance
        );
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isRotating, distance, updateGraph]);

  const handleManualSlider = (plane: 'xw' | 'yw' | 'zw', val: number) => {
    setIsRotating(false);
    if (plane === 'xw') { setAngleXW(val); angleRef.current.xw = val; }
    if (plane === 'yw') { setAngleYW(val); angleRef.current.yw = val; }
    if (plane === 'zw') { setAngleZW(val); angleRef.current.zw = val; }
    updateGraph(
      plane === 'xw' ? val : angleRef.current.xw,
      plane === 'yw' ? val : angleRef.current.yw,
      plane === 'zw' ? val : angleRef.current.zw,
      distance
    );
  };

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
              ? 'bg-rose-500 hover:bg-rose-400 text-white'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 text-white'
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
          <div className="flex items-center justify-between text-xs font-bold text-purple-200 mb-1.5">
            <span>θ_xw Plane</span>
            <span className="font-mono text-[10px] text-purple-400">
              {(angleRef.current.xw % (2 * Math.PI)).toFixed(2)} rad
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={2 * Math.PI}
            step="0.05"
            value={angleXW % (2 * Math.PI)}
            onChange={(e) => handleManualSlider('xw', parseFloat(e.target.value))}
            className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/50">
          <div className="flex items-center justify-between text-xs font-bold text-purple-200 mb-1.5">
            <span>θ_yw Plane</span>
            <span className="font-mono text-[10px] text-purple-400">
              {(angleRef.current.yw % (2 * Math.PI)).toFixed(2)} rad
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={2 * Math.PI}
            step="0.05"
            value={angleYW % (2 * Math.PI)}
            onChange={(e) => handleManualSlider('yw', parseFloat(e.target.value))}
            className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/50">
          <div className="flex items-center justify-between text-xs font-bold text-purple-200 mb-1.5">
            <span>θ_zw Plane</span>
            <span className="font-mono text-[10px] text-purple-400">
              {(angleRef.current.zw % (2 * Math.PI)).toFixed(2)} rad
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={2 * Math.PI}
            step="0.05"
            value={angleZW % (2 * Math.PI)}
            onChange={(e) => handleManualSlider('zw', parseFloat(e.target.value))}
            className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
        <Compass className="w-4 h-4 text-purple-400 shrink-0" />
        <span>
          <strong>4D Geometry:</strong> 16 Vertices in 4-space rotated through SO(4) rotation planes and projected into 3D. The corner node colors indicate their 4th dimensional (W) coordinate.
        </span>
      </div>
    </div>
  );
};
