import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { DimensionMode } from '../../types/graph';
import { LaTeXToolbar } from './LaTeXToolbar';
import { VisualBuilder } from './VisualBuilder';
import { AICopilotPrompt } from './AICopilotPrompt';
import { DynamicParametersPanel } from './DynamicParametersPanel';
import { TimeEvolutionPlayer } from './TimeEvolutionPlayer';
import { CalculusToolsPanel } from './CalculusToolsPanel';
import { AudioSonificationPanel } from './AudioSonificationPanel';
import { MultiEquationManager, EquationLayer } from './MultiEquationManager';
import { Tesseract4DStudio } from './Tesseract4DStudio';
import { ChaosSimulatorPanel } from './ChaosSimulatorPanel';
import { ComplexAnalysisPanel } from './ComplexAnalysisPanel';
import { QuantumOrbitalStudio } from './QuantumOrbitalStudio';
import { FractalStudio } from './FractalStudio';
import { MathChallengeGame } from './MathChallengeGame';
import { VoiceMathInput } from './VoiceMathInput';
import { ImageMathOCR } from './ImageMathOCR';
import { CalculusOptions } from '../../services/api';
import { 
  Play, 
  Sliders, 
  RefreshCw, 
  AlertCircle, 
  Calculator, 
  Code, 
  LayoutGrid, 
  Sparkles,
  Activity,
  Layers,
  Box,
  Zap,
  Orbit,
  Music,
  Atom,
  Compass,
  Trophy,
  Mic,
  Camera
} from 'lucide-react';

export type InputMode = 'plain' | 'latex' | 'visual' | 'copilot';
export type PrimaryMathTab = 'single' | 'multi' | 'quantum' | 'fractal' | 'game' | '4d' | 'chaos' | 'complex';

interface EquationInputProps {
  equation: string;
  setEquation: (eq: string) => void;
  onGenerate: (
    ranges?: Record<string, [number, number]>, 
    res?: number, 
    dimOverride?: DimensionMode,
    params?: Record<string, number>,
    calcOpts?: CalculusOptions
  ) => void;
  onGenerateMulti: (equations: string[], dimOverride?: DimensionMode) => void;
  onCustomGraphData: (data: any) => void;
  isLoading: boolean;
  dimensionMode: DimensionMode;
  setDimensionMode: (dim: DimensionMode) => void;
  detectedParameters?: string[];
  hasTime?: boolean;
  mathData?: any;
}

export const EquationInput: React.FC<EquationInputProps> = ({
  equation,
  setEquation,
  onGenerate,
  onGenerateMulti,
  onCustomGraphData,
  isLoading,
  dimensionMode,
  setDimensionMode,
  detectedParameters = [],
  hasTime = false,
  mathData,
}) => {
  const [primaryTab, setPrimaryTab] = useState<PrimaryMathTab>('single');
  const [inputMode, setInputMode] = useState<InputMode>('plain');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [katexError, setKatexError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showCalculus, setShowCalculus] = useState<boolean>(false);
  const [showAudio, setShowAudio] = useState<boolean>(false);

  // Multi-equation layers
  const [multiLayers, setMultiLayers] = useState<EquationLayer[]>([
    { id: '1', expression: 'y = x^2 - 4', color: '#38bdf8', visible: true },
    { id: '2', expression: 'y = 2*x + 1', color: '#ec4899', visible: true },
  ]);

  // Dynamic parameters dictionary (e.g. {a: 1.0, b: 2.0})
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [timeVal, setTimeVal] = useState<number>(0);

  // Calculus options
  const [calculusOptions, setCalculusOptions] = useState<CalculusOptions>({
    show_tangent: false,
    tangent_point: 1.0,
    show_integral: false,
    integral_range: [0.0, 3.0],
    riemann_n: 15,
  });

  // Domain ranges
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-10);
  const [yMax, setYMax] = useState<number>(10);
  const [zMin, setZMin] = useState<number>(-10);
  const [zMax, setZMax] = useState<number>(10);
  const [resolution, setResolution] = useState<number>(200);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync primaryTab with dimensionMode when 4D is selected
  useEffect(() => {
    if (dimensionMode === '4D' && primaryTab !== '4d') {
      setPrimaryTab('4d');
    }
  }, [dimensionMode]);

  // Update parameters when detected parameters change
  useEffect(() => {
    if (detectedParameters && detectedParameters.length > 0) {
      setParameters((prev) => {
        const next = { ...prev };
        detectedParameters.forEach((p) => {
          if (next[p] === undefined && p !== 't') {
            next[p] = 1.0;
          }
        });
        return next;
      });
    }
  }, [detectedParameters]);

  // Real-time KaTeX rendering preview
  useEffect(() => {
    if (!equation.trim()) {
      setPreviewHtml('');
      setKatexError(null);
      return;
    }

    try {
      const html = katex.renderToString(equation.trim(), {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      });
      setPreviewHtml(html);
      setKatexError(null);
    } catch (err: any) {
      setKatexError(err.message || 'LaTeX rendering error');
    }
  }, [equation]);

  const handleInsertSnippet = (snippet: string) => {
    if (!inputRef.current) {
      setEquation(equation + snippet);
      return;
    }
    const textarea = inputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const updated = current.substring(0, start) + snippet + current.substring(end);
    setEquation(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 10);
  };

  const handleSubmit = (
    dimOverride?: DimensionMode,
    customParams?: Record<string, number>,
    customCalcOpts?: CalculusOptions
  ) => {
    const targetDim = dimOverride || dimensionMode;
    const ranges: Record<string, [number, number]> = {
      x: [xMin, xMax],
      y: [yMin, yMax],
      z: [zMin, zMax],
      t: [0, 2 * Math.PI],
      theta: [0, 2 * Math.PI],
    };
    const paramsToSend = { ...(customParams || parameters) };
    if (hasTime || equation.includes('t')) {
      paramsToSend['t'] = timeVal;
    }
    onGenerate(
      ranges,
      resolution,
      targetDim,
      Object.keys(paramsToSend).length > 0 ? paramsToSend : undefined,
      customCalcOpts || calculusOptions
    );
  };

  const handleDimensionClick = (dim: DimensionMode) => {
    setDimensionMode(dim);
    if (dim === '4D') {
      setPrimaryTab('4d');
      return;
    }
    if (primaryTab === '4d') {
      setPrimaryTab('single');
    }
    if (equation.trim()) {
      handleSubmit(dim);
    }
  };

  const handleChangeParameter = (name: string, value: number) => {
    const nextParams = { ...parameters, [name]: value };
    setParameters(nextParams);
    handleSubmit(undefined, nextParams);
  };

  const handleResetParameters = () => {
    const resetParams: Record<string, number> = {};
    Object.keys(parameters).forEach((k) => {
      resetParams[k] = 1.0;
    });
    setParameters(resetParams);
    handleSubmit(undefined, resetParams);
  };

  const handleTimeStep = (t: number) => {
    setTimeVal(t);
    handleSubmit(undefined, { ...parameters, t });
  };

  const handleSelectVisualFormula = (formula: string, dim?: DimensionMode) => {
    setEquation(formula);
    if (dim) setDimensionMode(dim);
    setTimeout(() => {
      handleSubmit(dim);
    }, 50);
  };

  const handleCopilotGenerated = (
    genEquation: string,
    dim?: DimensionMode,
    ranges?: Record<string, [number, number]>
  ) => {
    setEquation(genEquation);
    if (dim) setDimensionMode(dim);
    if (ranges) {
      if (ranges.x) { setXMin(ranges.x[0]); setXMax(ranges.x[1]); }
      if (ranges.y) { setYMin(ranges.y[0]); setYMax(ranges.y[1]); }
      if (ranges.z) { setZMin(ranges.z[0]); setZMax(ranges.z[1]); }
    }
    setTimeout(() => {
      handleSubmit(dim);
    }, 50);
  };

  const isTimeEq = hasTime || equation.includes('t');
  const hasDynamicParams = Object.keys(parameters).filter((k) => k !== 't').length > 0;

  return (
    <div className="space-y-4">
      {/* Top Primary Feature Studio Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => { setPrimaryTab('single'); if (dimensionMode === '4D') setDimensionMode('3D'); }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
            primaryTab === 'single'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Equation</span>
        </button>

        <button
          type="button"
          onClick={() => { setPrimaryTab('multi'); }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
            primaryTab === 'multi'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Multi-Graph</span>
        </button>

        <button
          type="button"
          onClick={() => { setPrimaryTab('quantum'); setDimensionMode('3D'); }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
            primaryTab === 'quantum'
              ? 'bg-gradient-to-r from-cyan-400 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Atom className="w-3.5 h-3.5" />
          <span>Quantum |ψ|²</span>
        </button>

        <button
          type="button"
          onClick={() => { setPrimaryTab('fractal'); setDimensionMode('3D'); }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
            primaryTab === 'fractal'
              ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Fractals</span>
        </button>

        <button
          type="button"
          onClick={() => { setPrimaryTab('game'); setDimensionMode('2D'); }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
            primaryTab === 'game'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Math Game</span>
        </button>

        <button
          type="button"
          onClick={() => { setPrimaryTab('4d'); setDimensionMode('4D'); }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
            primaryTab === '4d'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>4D Studio</span>
        </button>

        <button
          type="button"
          onClick={() => { setPrimaryTab('chaos'); setDimensionMode('3D'); }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
            primaryTab === 'chaos'
              ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Chaos Theory</span>
        </button>

        <button
          type="button"
          onClick={() => { setPrimaryTab('complex'); setDimensionMode('3D'); }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
            primaryTab === 'complex'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Orbit className="w-3.5 h-3.5" />
          <span>Complex f(z)</span>
        </button>
      </div>

      {/* 1. Multi-Equation Layer Overlay */}
      {primaryTab === 'multi' && (
        <MultiEquationManager
          layers={multiLayers}
          setLayers={setMultiLayers}
          onGenerateMulti={onGenerateMulti}
          isLoading={isLoading}
          dimensionMode={dimensionMode}
          setDimensionMode={setDimensionMode}
          intersections={mathData?.intersections}
        />
      )}

      {/* 2. Quantum Hydrogen Orbital Studio */}
      {primaryTab === 'quantum' && (
        <QuantumOrbitalStudio
          onGraphData={onCustomGraphData}
          isLoading={isLoading}
        />
      )}

      {/* 3. Fractal & Chaos Studio */}
      {primaryTab === 'fractal' && (
        <FractalStudio
          onGraphData={onCustomGraphData}
          isLoading={isLoading}
        />
      )}

      {/* 4. Inverse Graphing Math Challenge Game */}
      {primaryTab === 'game' && (
        <MathChallengeGame
          onGraphData={onCustomGraphData}
        />
      )}

      {/* 5. 4D Hypercube Tesseract Studio */}
      {primaryTab === '4d' && (
        <Tesseract4DStudio
          onGraphData={onCustomGraphData}
          isLoading={isLoading}
        />
      )}

      {/* 6. Chaos & Attractor Studio */}
      {primaryTab === 'chaos' && (
        <ChaosSimulatorPanel
          onGraphData={onCustomGraphData}
          isLoading={isLoading}
        />
      )}

      {/* 7. Complex Analysis Studio */}
      {primaryTab === 'complex' && (
        <ComplexAnalysisPanel
          onGraphData={onCustomGraphData}
          isLoading={isLoading}
        />
      )}

      {/* 5. Standard Single Equation Studio */}
      {primaryTab === 'single' && (
        <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-slate-800 relative overflow-hidden space-y-4">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Dimension Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
            <div>
              <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <span>Equation Input Studio</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Choose your preferred mathematical input mode
              </p>
            </div>

            {/* 1D / 2D / 3D / 4D Dimension Selector Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
              {(['AUTO', '1D', '2D', '3D', '4D'] as DimensionMode[]).map((dim) => (
                <button
                  key={dim}
                  type="button"
                  onClick={() => handleDimensionClick(dim)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    dimensionMode === dim
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`}
                >
                  {dim === 'AUTO' ? 'Auto' : dim}
                </button>
              ))}
            </div>
          </div>

          {/* Input Mode Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setInputMode('plain')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                inputMode === 'plain'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Plain Math</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('latex')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                inputMode === 'latex'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>LaTeX Code</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('visual')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                inputMode === 'visual'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Visual Blocks</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('copilot')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                inputMode === 'copilot'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Copilot</span>
            </button>
          </div>

          {/* Mode 1 & 2: Plain Math / LaTeX Editor */}
          {(inputMode === 'plain' || inputMode === 'latex') && (
            <div className="space-y-3">
              {/* Multimodal Voice & OCR Input Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <VoiceMathInput
                  onEquationTranscribed={(eq) => {
                    setEquation(eq);
                    setTimeout(() => handleSubmit(), 50);
                  }}
                />
                <ImageMathOCR
                  onEquationDetected={(eq) => {
                    setEquation(eq);
                    setTimeout(() => handleSubmit(), 50);
                  }}
                />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3.5">
                {inputMode === 'latex' && <LaTeXToolbar onInsert={handleInsertSnippet} />}

              <div className="relative">
                <textarea
                  ref={inputRef}
                  rows={3}
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={
                    inputMode === 'plain'
                      ? 'Type naturally: sin(x)*cos(y)  or  f(x) = [ e^(-0.5 * ((x - μ) / σ)^2) ] / (σ * √(2π))  or  y = a*x^2 + b*x + c'
                      : 'Type LaTeX: z = \\sin(x)\\cos(y)  or  x^2 + y^2 + z^2 = 25  or  e^{i\\pi} + 1 = 0'
                  }
                  className="w-full bg-[#050811] text-cyan-300 font-mono text-base md:text-lg p-3.5 rounded-xl border border-cyan-900/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all placeholder:text-slate-600 shadow-inner"
                />
                <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-mono">
                  Ctrl + Enter to plot
                </div>
              </div>

              {/* Live KaTeX Rendered Preview */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 min-h-[58px] flex flex-col justify-center">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Live LaTeX Preview</span>
                  {equation && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Rendered with KaTeX
                    </span>
                  )}
                </div>
                {previewHtml ? (
                  <div
                    className="text-slate-100 text-base md:text-lg py-0.5 overflow-x-auto text-center"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <div className="text-slate-600 text-xs italic text-center py-1">
                    Preview will appear here in real time...
                  </div>
                )}
                {katexError && (
                  <div className="mt-1 text-xs text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{katexError}</span>
                  </div>
                )}
              </div>
            </form>
          </div>
          )}

          {/* Mode 3: Visual Block Palette */}
          {inputMode === 'visual' && (
            <VisualBuilder
              onSelectFormula={handleSelectVisualFormula}
              onAppendSnippet={handleInsertSnippet}
            />
          )}

          {/* Mode 4: AI Copilot */}
          {inputMode === 'copilot' && (
            <AICopilotPrompt onEquationGenerated={handleCopilotGenerated} />
          )}

          {/* 4D Time Evolution Player (if t parameter is in formula) */}
          {isTimeEq && (
            <TimeEvolutionPlayer
              time={timeVal}
              setTime={setTimeVal}
              onTimeStep={handleTimeStep}
            />
          )}

          {/* Dynamic Parameters Sliders (e.g. a, b, c, mu, sigma) */}
          {hasDynamicParams && (
            <DynamicParametersPanel
              parameters={parameters}
              onChangeParameter={handleChangeParameter}
              onResetParameters={handleResetParameters}
            />
          )}

          {/* Equation Audio Sonification Toggle & Panel */}
          <div>
            <button
              type="button"
              onClick={() => setShowAudio(!showAudio)}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-bold mb-2"
            >
              <Music className="w-3.5 h-3.5" />
              <span>{showAudio ? 'Hide Audio Sonification' : 'Listen to Equation Audio (Web Audio Synth)'}</span>
            </button>

            {showAudio && (
              <AudioSonificationPanel
                equation={equation}
                mathData={mathData}
              />
            )}
          </div>

          {/* Calculus Tools Toggle & Panel */}
          <div>
            <button
              type="button"
              onClick={() => setShowCalculus(!showCalculus)}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-bold mb-2"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{showCalculus ? 'Hide Calculus Intelligence Tools' : 'Show Calculus Tools (Tangents & Integrals)'}</span>
            </button>

            {showCalculus && (
              <CalculusToolsPanel
                options={calculusOptions}
                onChangeOptions={setCalculusOptions}
                onApplyCalculus={(opts) => handleSubmit(undefined, undefined, opts)}
                domain={[xMin, xMax]}
              />
            )}
          </div>

          {/* Advanced Domain Ranges Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Domain Ranges & Mesh Settings' : 'Custom Domain Ranges & Resolution'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    X Domain [Min, Max]
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={xMin}
                      onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                    <span className="text-slate-500 text-xs">to</span>
                    <input
                      type="number"
                      value={xMax}
                      onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Y Domain [Min, Max]
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={yMin}
                      onChange={(e) => setYMin(parseFloat(e.target.value) || -10)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                    <span className="text-slate-500 text-xs">to</span>
                    <input
                      type="number"
                      value={yMax}
                      onChange={(e) => setYMax(parseFloat(e.target.value) || 10)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Z Domain [Min, Max]
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={zMin}
                      onChange={(e) => setZMin(parseFloat(e.target.value) || -10)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                    <span className="text-slate-500 text-xs">to</span>
                    <input
                      type="number"
                      value={zMax}
                      onChange={(e) => setZMax(parseFloat(e.target.value) || 10)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>Sampling Density:</span>
                    <span className="text-cyan-400 font-mono">{resolution} pts</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    step="25"
                    value={resolution}
                    onChange={(e) => setResolution(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Generate Action Button */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isLoading || !equation.trim()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-xl ${
                isLoading || !equation.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Evaluating Graph...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Generate Graph ({dimensionMode})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
