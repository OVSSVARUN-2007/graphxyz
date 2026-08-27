import confetti from "canvas-confetti";
import { AlertTriangle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { EquationInput } from "./components/MathSection/EquationInput";
import { MathInsights } from "./components/MathSection/MathInsights";
import { ExportModal } from "./components/Modals/ExportModal";
import { HistoryDrawer } from "./components/Modals/HistoryDrawer";
import { PresetModal } from "./components/Modals/PresetModal";
import { AIAnalysisPanel } from "./components/NLPSection/AIAnalysisPanel";
import { TextInput } from "./components/NLPSection/TextInput";
import { GraphCanvas } from "./components/Visualization/GraphCanvas";
import { analyzeNLP, evaluateMath, fetchPresets } from "./services/api";
import {
    AppMode,
    DimensionMode,
    DimReductionMethod,
    HistoryItem,
    MathGraphData,
    NLPAnalysisData,
    PresetEquation,
    PresetText,
} from "./types/graph";

export const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>("equation");
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    // Input states
    const [equation, setEquation] = useState<string>("z = \\sin(x)\\cos(y)");
    const [text, setText] = useState<string>(
        "Artificial intelligence and neural networks are transforming science, mathematics, and computation. Today is a wonderful day filled with curiosity and joy, although debugging distributed systems can sometimes be frustrating.",
    );

    // Configuration options
    const [dimensionMode, setDimensionMode] = useState<DimensionMode>("AUTO");
    const [reductionMethod, setReductionMethod] = useState<DimReductionMethod>("PCA");

    // Results state
    const [mathData, setMathData] = useState<MathGraphData | null>(null);
    const [nlpData, setNlpData] = useState<NLPAnalysisData | null>(null);
    const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);

    // UI state
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [presets, setPresets] = useState<{ equations: PresetEquation[]; texts: PresetText[] }>({
        equations: [],
        texts: [],
    });
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const saved = localStorage.getItem("graphx_history");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Modals state
    const [isPresetOpen, setIsPresetOpen] = useState<boolean>(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
    const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

    // Sync theme with HTML class
    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    // Load presets & trigger initial graph evaluation
    useEffect(() => {
        const init = async () => {
            try {
                const presetsData = await fetchPresets();
                setPresets(presetsData);
            } catch (err) {
                console.warn("Could not load presets from server:", err);
            }
            // Initial evaluation of default equation
            handleGenerateMath();
        };
        init();
    }, []);

    // Save history to localStorage
    useEffect(() => {
        try {
            localStorage.setItem("graphx_history", JSON.stringify(history.slice(0, 30)));
        } catch (e) {
            console.warn("Failed saving history:", e);
        }
    }, [history]);

    const toggleTheme = () => {
        setTheme(prev => (prev === "dark" ? "light" : "dark"));
    };

    // --- MATH EVALUATION HANDLER ---
    const handleGenerateMath = async (ranges?: Record<string, [number, number]>, resolution?: number) => {
        if (!equation.trim()) return;
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const res = await evaluateMath(equation, {
                domain_ranges: ranges,
                resolution: resolution || 200,
                dimension_override: dimensionMode,
            });

            setMathData(res.data);

            // Add to history
            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                mode: "equation",
                input: equation,
                title: res.data.type.replace(/_/g, " "),
                dimension: res.data.dimension,
                resultSummary: `${res.data.type} • ${res.data.dimension} Mesh`,
            };
            setHistory(prev => [newHistoryItem, ...prev.filter(h => h.input !== equation)]);

            // Confetti burst
            confetti({
                particleCount: 25,
                spread: 45,
                origin: { y: 0.8 },
                colors: ["#06b6d4", "#3b82f6", "#8b5cf6"],
            });
        } catch (err: any) {
            setErrorMessage(err.message || "Error evaluating equation. Please verify syntax.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- NLP ANALYSIS HANDLER ---
    const handleAnalyzeNLP = async (
        method: DimReductionMethod = reductionMethod,
        dim: DimensionMode = dimensionMode,
    ) => {
        if (!text.trim()) return;
        setIsLoading(true);
        setErrorMessage(null);
        setSelectedSentenceIndex(null);

        try {
            const res = await analyzeNLP(text, {
                method,
                dimension_override: dim,
            });

            setNlpData(res.analysis);

            // Add to history
            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                mode: "nlp",
                input: text.slice(0, 60) + (text.length > 60 ? "..." : ""),
                title: `${method} Semantic Reduction`,
                dimension: res.analysis.recommendation.recommended_visualization.includes("3D") ? "3D" : "2D",
                resultSummary: `Sentiment: ${res.analysis.sentiment.label} • ${res.analysis.sentences.length} sentences`,
            };
            setHistory(prev => [newHistoryItem, ...prev.filter(h => h.input !== newHistoryItem.input)]);

            // Confetti burst
            confetti({
                particleCount: 30,
                spread: 50,
                origin: { y: 0.8 },
                colors: ["#a855f7", "#ec4899", "#06b6d4"],
            });
        } catch (err: any) {
            setErrorMessage(err.message || "Error executing AI text analysis pipeline.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectHistory = (item: HistoryItem) => {
        if (item.mode === "equation") {
            setMode("equation");
            setEquation(item.input);
            setTimeout(() => handleGenerateMath(), 50);
        } else {
            setMode("nlp");
            setText(item.input);
            setTimeout(() => handleAnalyzeNLP(), 50);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans transition-colors duration-200">
            {/* Top Header */}
            <Header
                mode={mode}
                setMode={newMode => {
                    setMode(newMode);
                    setErrorMessage(null);
                    if (newMode === "nlp" && !nlpData) {
                        handleAnalyzeNLP();
                    } else if (newMode === "equation" && !mathData) {
                        handleGenerateMath();
                    }
                }}
                onOpenPresets={() => setIsPresetOpen(true)}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
                theme={theme}
                toggleTheme={toggleTheme}
                hasGraph={Boolean((mode === "equation" && mathData) || (mode === "nlp" && nlpData))}
            />

            {/* Main Workspace Layout */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
                {/* Error Notification Banner */}
                {errorMessage && (
                    <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-start justify-between gap-3 animate-in slide-in-from-top duration-200 shadow-lg shadow-rose-950/40">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold">Input Error</h4>
                                <p className="text-xs text-rose-300 mt-0.5 font-mono">{errorMessage}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="text-xs px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-semibold"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Primary Split View: Left Input / Controls, Right Interactive Graph */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Mode Inputs & Analysis Details */}
                    <div className="lg:col-span-5 space-y-5">
                        {mode === "equation" ? (
                            <>
                                <EquationInput
                                    equation={equation}
                                    setEquation={setEquation}
                                    onGenerate={handleGenerateMath}
                                    isLoading={isLoading}
                                    dimensionMode={dimensionMode}
                                    setDimensionMode={setDimensionMode}
                                />
                                {mathData && <MathInsights data={mathData} />}
                            </>
                        ) : (
                            <>
                                <TextInput
                                    text={text}
                                    setText={setText}
                                    onAnalyze={handleAnalyzeNLP}
                                    isLoading={isLoading}
                                    reductionMethod={reductionMethod}
                                    setReductionMethod={setReductionMethod}
                                    dimensionMode={dimensionMode}
                                    setDimensionMode={setDimensionMode}
                                    samplePresets={presets.texts}
                                />
                                {nlpData && (
                                    <AIAnalysisPanel
                                        data={nlpData}
                                        selectedSentenceIndex={selectedSentenceIndex}
                                        onSelectSentence={setSelectedSentenceIndex}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Column: Interactive Plotly Graph Canvas */}
                    <div className="lg:col-span-7 h-full sticky top-20">
                        <GraphCanvas
                            mode={mode}
                            mathData={mathData}
                            nlpData={nlpData}
                            dimensionMode={dimensionMode}
                            setDimensionMode={setDimensionMode}
                            selectedSentenceIndex={selectedSentenceIndex}
                            theme={theme}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-slate-800/80 bg-[#070b14]/80 py-4 px-6 mt-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400">Graphx Studio</span>
                    <span>•</span>
                    <span>FastAPI + PyTorch Transformer + Sympy + Plotly.js</span>
                </div>
                <div className="text-[11px] text-slate-600">
                    Precision Mathematical Engine & NLP Manifold Visualizer
                </div>
            </footer>

            {/* Modals & Drawers */}
            <PresetModal
                isOpen={isPresetOpen}
                onClose={() => setIsPresetOpen(false)}
                equations={presets.equations}
                texts={presets.texts}
                onSelectEquation={eq => {
                    setMode("equation");
                    setEquation(eq);
                    setTimeout(() => handleGenerateMath(), 50);
                }}
                onSelectText={txt => {
                    setMode("nlp");
                    setText(txt);
                    setTimeout(() => handleAnalyzeNLP(), 50);
                }}
                currentMode={mode}
            />

            <ExportModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                mathData={mathData}
                nlpData={nlpData}
                currentEquation={equation}
                currentText={text}
                mode={mode}
            />

            <HistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onSelectHistory={handleSelectHistory}
                onClearHistory={() => setHistory([])}
            />
        </div>
    );
};

export default App;
