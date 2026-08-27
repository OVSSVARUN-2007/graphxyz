import { Compass } from "lucide-react";
import Plotly from "plotly.js-dist-min";
import React, { useEffect, useRef, useState } from "react";
import { AppMode, DimensionMode, MathGraphData, NLPAnalysisData } from "../../types/graph";
import { GraphControls } from "./GraphControls";

interface GraphCanvasProps {
    mode: AppMode;
    mathData: MathGraphData | null;
    nlpData: NLPAnalysisData | null;
    dimensionMode: DimensionMode;
    setDimensionMode: (dim: DimensionMode) => void;
    selectedSentenceIndex: number | null;
    theme: "dark" | "light";
    onDimensionChange?: (dim: DimensionMode) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
    mode,
    mathData,
    nlpData,
    dimensionMode,
    setDimensionMode,
    selectedSentenceIndex,
    theme,
    onDimensionChange,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [colorscale, setColorscale] = useState<string>("Viridis");
    const [surfaceMode, setSurfaceMode] = useState<"surface" | "wireframe" | "points">("surface");
    const [nlpViewMode, setNlpViewMode] = useState<string>("3D_SEMANTIC_MAP");

    // Sync NLP view with dimension mode
    useEffect(() => {
        if (mode === "nlp" && nlpData) {
            if (dimensionMode === "1D") {
                setNlpViewMode("SENTIMENT_PROGRESSION");
            } else if (dimensionMode === "2D") {
                setNlpViewMode("2D_SEMANTIC_MAP");
            } else if (dimensionMode === "3D") {
                setNlpViewMode("3D_SEMANTIC_MAP");
            }
        }
    }, [dimensionMode, mode, nlpData]);

    // Determine if current visualization is 3D
    const is3D =
        mode === "equation"
            ? mathData?.dimension === "3D" || dimensionMode === "3D"
            : nlpViewMode === "3D_SEMANTIC_MAP" || dimensionMode === "3D";

    const handleDimensionSelect = (dim: DimensionMode) => {
        setDimensionMode(dim);
        if (onDimensionChange) {
            onDimensionChange(dim);
        }
    };

    // Build and render plot
    useEffect(() => {
        if (!containerRef.current) return;

        const isDark = theme === "dark";
        const bgColor = isDark ? "#060a14" : "#f8fafc";
        const paperColor = isDark ? "#060a14" : "#f8fafc";
        const textColor = isDark ? "#e2e8f0" : "#0f172a";
        const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";

        let traces: any[] = [];
        let layout: any = {
            autosize: true,
            paper_bgcolor: paperColor,
            plot_bgcolor: bgColor,
            font: {
                family: "Inter, system-ui, sans-serif",
                color: textColor,
                size: 11,
            },
            margin: { l: 45, r: 35, t: 40, b: 45 },
            showlegend: true,
            legend: {
                x: 0,
                y: 1.15,
                orientation: "h",
                font: { color: textColor, size: 10 },
            },
        };

        // --- MODE A: EQUATION GRAPHING ---
        if (mode === "equation" && mathData) {
            traces = JSON.parse(JSON.stringify(mathData.traces || []));

            // Apply surface mode / wireframe / points override
            traces = traces.map((t: any) => {
                if (t.type === "surface") {
                    t.colorscale = colorscale;
                    if (surfaceMode === "wireframe") {
                        t.hidesurface = true;
                        t.contours = {
                            x: { show: true, color: "#38bdf8", width: 1.5 },
                            y: { show: true, color: "#38bdf8", width: 1.5 },
                            z: { show: true, color: "#38bdf8", width: 1.5 },
                        };
                    } else if (surfaceMode === "points") {
                        const xFlat: number[] = [];
                        const yFlat: number[] = [];
                        const zFlat: number[] = [];
                        if (Array.isArray(t.z)) {
                            for (let i = 0; i < t.z.length; i++) {
                                for (let j = 0; j < (t.z[i]?.length || 0); j++) {
                                    if (t.z[i][j] !== null && !isNaN(t.z[i][j])) {
                                        xFlat.push(t.x?.[j] ?? j);
                                        yFlat.push(t.y?.[i] ?? i);
                                        zFlat.push(t.z[i][j]);
                                    }
                                }
                            }
                        }
                        return {
                            type: "scatter3d",
                            mode: "markers",
                            x: xFlat,
                            y: yFlat,
                            z: zFlat,
                            marker: {
                                size: 2.5,
                                color: zFlat,
                                colorscale: colorscale,
                                opacity: 0.85,
                            },
                            name: t.name,
                        };
                    }
                }
                return t;
            });

            if (mathData.dimension === "3D" || dimensionMode === "3D") {
                layout.scene = {
                    xaxis: { title: "X Axis", gridcolor: gridColor, showbackground: false },
                    yaxis: { title: "Y Axis", gridcolor: gridColor, showbackground: false },
                    zaxis: { title: "Z Axis", gridcolor: gridColor, showbackground: false },
                    camera: {
                        eye: { x: 1.4, y: 1.4, z: 1.2 },
                    },
                    ...(mathData.layout_recommendations?.scene || {}),
                };
            } else {
                layout.xaxis = {
                    title: mathData.metadata?.independent_vars?.[0] || "x",
                    gridcolor: gridColor,
                    zerolinecolor: isDark ? "#475569" : "#cbd5e1",
                    ...(mathData.layout_recommendations?.xaxis || {}),
                };
                layout.yaxis = {
                    title: mathData.metadata?.dependent_var || "y",
                    gridcolor: gridColor,
                    zerolinecolor: isDark ? "#475569" : "#cbd5e1",
                    ...(mathData.layout_recommendations?.yaxis || {}),
                };
            }
        }

        // --- MODE B: AI TEXT-TO-GRAPH ---
        else if (mode === "nlp" && nlpData) {
            // 1. 3D or 2D SEMANTIC MANIFOLD MAP
            if (nlpViewMode === "3D_SEMANTIC_MAP" || nlpViewMode === "2D_SEMANTIC_MAP") {
                const is3DMap = nlpViewMode === "3D_SEMANTIC_MAP";
                const points = is3DMap ? nlpData.embeddings_3d || [] : nlpData.embeddings_2d || [];

                const docPoints = points.filter(p => p.type === "document");
                const sentPoints = points.filter(p => p.type === "sentence");
                const anchorPoints = points.filter(p => p.type === "anchor");

                // Document Node
                if (docPoints.length > 0) {
                    traces.push({
                        type: is3DMap ? "scatter3d" : "scatter",
                        mode: "markers+text",
                        name: "Full Text Embedding",
                        x: docPoints.map(p => p.x),
                        y: docPoints.map(p => p.y),
                        ...(is3DMap ? { z: docPoints.map(p => p.z) } : {}),
                        text: docPoints.map(p => "Full Text"),
                        textposition: "top center",
                        hovertext: docPoints.map(p => p.full_text),
                        marker: {
                            size: is3DMap ? 10 : 14,
                            symbol: "diamond",
                            color: "#ec4899",
                            line: { color: "#ffffff", width: 2 },
                        },
                    });
                }

                // Sentence Progression Trajectory
                if (sentPoints.length > 0) {
                    traces.push({
                        type: is3DMap ? "scatter3d" : "scatter",
                        mode: "markers+lines+text",
                        name: "Sentence Progression Trajectory",
                        x: sentPoints.map(p => p.x),
                        y: sentPoints.map(p => p.y),
                        ...(is3DMap ? { z: sentPoints.map(p => p.z) } : {}),
                        text: sentPoints.map((p, i) => `S${i + 1}`),
                        textposition: "bottom center",
                        hovertext: sentPoints.map(p => p.full_text),
                        line: {
                            color: "rgba(168, 85, 247, 0.6)",
                            width: is3DMap ? 4 : 2,
                            dash: "dot",
                        },
                        marker: {
                            size: sentPoints.map((p, i) =>
                                selectedSentenceIndex === i + 1 ? (is3DMap ? 12 : 16) : is3DMap ? 8 : 10,
                            ),
                            color: sentPoints.map((p, i) => (selectedSentenceIndex === i + 1 ? "#22d3ee" : "#a855f7")),
                            line: { color: "#ffffff", width: 1.5 },
                        },
                    });
                }

                // Semantic Anchor Landmarks
                if (anchorPoints.length > 0) {
                    traces.push({
                        type: is3DMap ? "scatter3d" : "scatter",
                        mode: "markers+text",
                        name: "Knowledge Domain Anchors",
                        x: anchorPoints.map(p => p.x),
                        y: anchorPoints.map(p => p.y),
                        ...(is3DMap ? { z: anchorPoints.map(p => p.z) } : {}),
                        text: anchorPoints.map(p => p.label),
                        textposition: "top right",
                        hovertext: anchorPoints.map(p => p.full_text),
                        marker: {
                            size: is3DMap ? 6 : 8,
                            symbol: "circle",
                            color: "#06b6d4",
                            opacity: 0.75,
                        },
                    });
                }

                if (is3DMap) {
                    layout.scene = {
                        xaxis: { title: "Manifold Dim 1", gridcolor: gridColor },
                        yaxis: { title: "Manifold Dim 2", gridcolor: gridColor },
                        zaxis: { title: "Manifold Dim 3", gridcolor: gridColor },
                        camera: {
                            eye: { x: 1.3, y: 1.3, z: 1.1 },
                        },
                    };
                } else {
                    layout.xaxis = { title: "Semantic Manifold X", gridcolor: gridColor };
                    layout.yaxis = { title: "Semantic Manifold Y", gridcolor: gridColor };
                }
            }

            // 2. SENTIMENT PROGRESSION (1D Arc)
            else if (nlpViewMode === "SENTIMENT_PROGRESSION") {
                const sentences = nlpData.sentences || [];
                traces.push({
                    type: "scatter",
                    mode: "lines+markers",
                    name: "Sentiment Arc",
                    x: sentences.map(s => `S${s.index}`),
                    y: sentences.map(s => s.sentiment.compound_score),
                    hovertext: sentences.map(s => `"${s.text}"\nSentiment: ${s.sentiment.label}`),
                    line: { color: "#a855f7", width: 3, shape: "spline" },
                    marker: {
                        size: 10,
                        color: sentences.map(s =>
                            s.sentiment.compound_score > 0.15
                                ? "#10b981"
                                : s.sentiment.compound_score < -0.15
                                  ? "#f43f5e"
                                  : "#f59e0b",
                        ),
                    },
                });
                layout.xaxis = { title: "Sentence Timeline (1D)", gridcolor: gridColor };
                layout.yaxis = {
                    title: "Compound Polarity [-1 to +1]",
                    gridcolor: gridColor,
                    range: [-1.05, 1.05],
                };
            }

            // 3. EMOTION RADAR
            else if (nlpViewMode === "EMOTION_RADAR") {
                const emotionKeys = Object.keys(nlpData.emotions || {});
                const emotionVals = Object.values(nlpData.emotions || {});
                const rVals = [...emotionVals, emotionVals[0]];
                const thetaVals = [...emotionKeys, emotionKeys[0]];

                traces.push({
                    type: "scatterpolar",
                    r: rVals,
                    theta: thetaVals,
                    fill: "toself",
                    fillcolor: "rgba(236, 72, 153, 0.35)",
                    line: { color: "#ec4899", width: 2.5 },
                    name: "Emotion Spectrum",
                });
                layout.polar = {
                    radialaxis: { visible: true, range: [0, 1], gridcolor: gridColor },
                    angularaxis: { gridcolor: gridColor },
                };
            }

            // 4. TOPIC DISTRIBUTION BAR
            else if (nlpViewMode === "TOPIC_DISTRIBUTION") {
                const topicKeys = Object.keys(nlpData.topics || {});
                const topicVals = Object.values(nlpData.topics || {}).map(v => v * 100);

                traces.push({
                    type: "bar",
                    x: topicKeys,
                    y: topicVals,
                    marker: {
                        color: topicVals,
                        colorscale: "Purples",
                    },
                    name: "Topic Probability (%)",
                });
                layout.xaxis = { title: "Topic Domain", gridcolor: gridColor, tickangle: -20 };
                layout.yaxis = { title: "Probability (%)", gridcolor: gridColor, range: [0, 100] };
            }

            // 5. KEYWORD RELEVANCE BAR
            else if (nlpViewMode === "KEYWORD_RELEVANCE") {
                const kwList = [...(nlpData.keywords || [])].reverse();
                traces.push({
                    type: "bar",
                    orientation: "h",
                    x: kwList.map(k => k.relevance),
                    y: kwList.map(k => k.keyword),
                    marker: {
                        color: kwList.map(k => k.relevance),
                        colorscale: "Viridis",
                    },
                    name: "Concept Relevance",
                });
                layout.xaxis = { title: "Relevance Score [0 - 1]", gridcolor: gridColor };
                layout.yaxis = { title: "Key Concept", gridcolor: gridColor };
            }

            // 6. WORD FREQUENCY BAR
            else if (nlpViewMode === "WORD_FREQUENCY") {
                const words = Object.keys(nlpData.word_frequency || {});
                const freqs = Object.values(nlpData.word_frequency || {});

                traces.push({
                    type: "bar",
                    x: words,
                    y: freqs,
                    marker: { color: "#06b6d4" },
                    name: "Term Frequency",
                });
                layout.xaxis = { title: "Word", gridcolor: gridColor };
                layout.yaxis = { title: "Count", gridcolor: gridColor };
            }
        }

        if (traces.length === 0) {
            Plotly.purge(containerRef.current);
            return;
        }

        const config: any = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["sendDataToCloud", "hoverClosestCartesian", "hoverCompareCartesian"],
            toImageButtonOptions: {
                format: "png",
                filename: "graphxyz_visualization",
                height: 850,
                width: 1300,
                scale: 2,
            },
        };

        Plotly.react(containerRef.current, traces, layout, config);

        const handleResize = () => {
            if (containerRef.current) {
                Plotly.Plots.resize(containerRef.current);
            }
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [mode, mathData, nlpData, colorscale, surfaceMode, nlpViewMode, selectedSentenceIndex, theme, dimensionMode]);

    const handleResetView = () => {
        if (containerRef.current) {
            Plotly.relayout(containerRef.current, {
                "scene.camera.eye": { x: 1.4, y: 1.4, z: 1.2 },
                "xaxis.autorange": true,
                "yaxis.autorange": true,
            });
        }
    };

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };

    const hasData = (mode === "equation" && mathData) || (mode === "nlp" && nlpData);

    return (
        <div className="glass-panel rounded-2xl p-4 md:p-5 shadow-2xl border border-slate-800 space-y-3 flex flex-col h-full min-h-[520px]">
            {/* Dimension & View Controls Toolbar */}
            <GraphControls
                mode={mode}
                dimensionMode={dimensionMode}
                setDimensionMode={handleDimensionSelect}
                colorscale={colorscale}
                setColorscale={setColorscale}
                surfaceMode={surfaceMode}
                setSurfaceMode={setSurfaceMode}
                nlpViewMode={nlpViewMode}
                setNlpViewMode={setNlpViewMode}
                availableNlpViews={
                    nlpData?.recommendation?.available_views || [
                        "3D_SEMANTIC_MAP",
                        "2D_SEMANTIC_MAP",
                        "SENTIMENT_PROGRESSION",
                        "EMOTION_RADAR",
                        "TOPIC_DISTRIBUTION",
                        "KEYWORD_RELEVANCE",
                        "WORD_FREQUENCY",
                    ]
                }
                onResetView={handleResetView}
                onToggleFullscreen={handleToggleFullscreen}
                isFullscreen={isFullscreen}
                is3D={is3D}
            />

            {/* Plotly Canvas Container */}
            <div className="relative flex-1 w-full min-h-[460px] rounded-xl overflow-hidden bg-[#060a14] border border-slate-800/80 flex items-center justify-center">
                {!hasData ? (
                    <div className="text-center p-8 space-y-3 max-w-md">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-slate-700 flex items-center justify-center">
                            <Compass className="w-8 h-8 text-cyan-400 animate-pulse" />
                        </div>
                        <h3 className="text-base font-bold text-slate-200">Interactive 1D, 2D & 3D Canvas</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {mode === "equation"
                                ? "Enter an equation and select [1D], [2D], or [3D] to visualize functions, curves, or 3D surfaces."
                                : "Enter natural language text to compute deep Transformer embeddings, manifold projections, sentiment arcs, and emotion distributions."}
                        </p>
                    </div>
                ) : (
                    <div ref={containerRef} className="w-full h-full" />
                )}
            </div>
        </div>
    );
};
