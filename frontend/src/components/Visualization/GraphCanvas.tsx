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
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
    mode,
    mathData,
    nlpData,
    dimensionMode,
    setDimensionMode,
    selectedSentenceIndex,
    theme,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [colorscale, setColorscale] = useState<string>("Viridis");
    const [surfaceMode, setSurfaceMode] = useState<"surface" | "wireframe" | "points">("surface");
    const [nlpViewMode, setNlpViewMode] = useState<string>("3D_SEMANTIC_MAP");

    // Sync NLP recommendation when new data arrives
    useEffect(() => {
        if (nlpData?.recommendation?.recommended_visualization) {
            setNlpViewMode(nlpData.recommendation.recommended_visualization);
        }
    }, [nlpData]);

    // Determine if current visualization is 3D
    const is3D = mode === "equation" ? mathData?.dimension === "3D" : nlpViewMode === "3D_SEMANTIC_MAP";

    // Build and render plot
    useEffect(() => {
        if (!containerRef.current) return;

        const isDark = theme === "dark";
        const bgColor = isDark ? "#080d1a" : "#f8fafc";
        const paperColor = isDark ? "#080d1a" : "#f8fafc";
        const textColor = isDark ? "#e2e8f0" : "#1e293b";
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
            margin: { l: 50, r: 40, t: 40, b: 50 },
            showlegend: true,
            legend: {
                x: 0,
                y: 1.15,
                orientation: "h",
                font: { color: textColor },
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
                            x: { show: true, color: "#38bdf8", width: 1 },
                            y: { show: true, color: "#38bdf8", width: 1 },
                            z: { show: true, color: "#38bdf8", width: 1 },
                        };
                    } else if (surfaceMode === "points") {
                        // Flatten surface matrix to scatter3d points
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
                                opacity: 0.8,
                            },
                            name: t.name,
                        };
                    }
                }
                return t;
            });

            if (mathData.dimension === "3D") {
                layout.scene = {
                    xaxis: { title: "X Axis", gridcolor: gridColor, showbackground: false },
                    yaxis: { title: "Y Axis", gridcolor: gridColor, showbackground: false },
                    zaxis: { title: "Z Axis", gridcolor: gridColor, showbackground: false },
                    camera: {
                        eye: { x: 1.4, y: 1.4, z: 1.2 },
                    },
                };
            } else {
                layout.xaxis = {
                    title: mathData.metadata?.independent_vars?.[0] || "x",
                    gridcolor: gridColor,
                    zerolinecolor: isDark ? "#475569" : "#cbd5e1",
                };
                layout.yaxis = {
                    title: mathData.metadata?.dependent_var || "y",
                    gridcolor: gridColor,
                    zerolinecolor: isDark ? "#475569" : "#cbd5e1",
                };
            }
        }

        // --- MODE B: AI TEXT-TO-GRAPH ---
        else if (mode === "nlp" && nlpData) {
            if (nlpViewMode === "3D_SEMANTIC_MAP" || nlpViewMode === "2D_SEMANTIC_MAP") {
                const is3DMap = nlpViewMode === "3D_SEMANTIC_MAP";
                const points = is3DMap ? nlpData.embeddings_3d : nlpData.embeddings_2d;

                // Group points by type: Document, Sentence, Anchor
                const docPoints = points.filter(p => p.type === "document");
                const sentPoints = points.filter(p => p.type === "sentence");
                const anchorPoints = points.filter(p => p.type === "anchor");

                // Document Trace (Star / Large Diamond)
                if (docPoints.length > 0) {
                    traces.push({
                        type: is3DMap ? "scatter3d" : "scatter",
                        mode: "markers+text",
                        name: "Full Document Embedding",
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

                // Sentence Traces (Colored spheres / markers)
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
                            color: "rgba(168, 85, 247, 0.5)",
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

                // Semantic Knowledge Anchors Trace
                if (anchorPoints.length > 0) {
                    traces.push({
                        type: is3DMap ? "scatter3d" : "scatter",
                        mode: "markers+text",
                        name: "Semantic Knowledge Landmarks",
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
                            opacity: 0.7,
                        },
                    });
                }

                if (is3DMap) {
                    layout.scene = {
                        xaxis: { title: "Semantic Dim 1", gridcolor: gridColor },
                        yaxis: { title: "Semantic Dim 2", gridcolor: gridColor },
                        zaxis: { title: "Semantic Dim 3", gridcolor: gridColor },
                        camera: {
                            eye: { x: 1.3, y: 1.3, z: 1.1 },
                        },
                    };
                } else {
                    layout.xaxis = { title: "Semantic Dimension 1 (X)", gridcolor: gridColor };
                    layout.yaxis = { title: "Semantic Dimension 2 (Y)", gridcolor: gridColor };
                }
            }

            // Sentence Sentiment Progression Line Chart
            else if (nlpViewMode === "SENTIMENT_PROGRESSION") {
                const sentences = nlpData.sentences || [];
                traces.push({
                    type: "scatter",
                    mode: "lines+markers",
                    name: "Compound Sentiment Arc",
                    x: sentences.map(s => `S${s.index}`),
                    y: sentences.map(s => s.sentiment.compound_score),
                    hovertext: sentences.map(s => `"${s.text}"\nLabel: ${s.sentiment.label}`),
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
                layout.xaxis = { title: "Sentence Index (Timeline)", gridcolor: gridColor };
                layout.yaxis = {
                    title: "Compound Sentiment Score [-1 to +1]",
                    gridcolor: gridColor,
                    range: [-1.05, 1.05],
                };
            }

            // Emotion Radar Chart
            else if (nlpViewMode === "EMOTION_RADAR") {
                const emotionKeys = Object.keys(nlpData.emotions || {});
                const emotionVals = Object.values(nlpData.emotions || {});
                // Close polygon loop
                const rVals = [...emotionVals, emotionVals[0]];
                const thetaVals = [...emotionKeys, emotionKeys[0]];

                traces.push({
                    type: "scatterpolar",
                    r: rVals,
                    theta: thetaVals,
                    fill: "toself",
                    fillcolor: "rgba(236, 72, 153, 0.3)",
                    line: { color: "#ec4899", width: 2 },
                    name: "Emotion Spectrum",
                });
                layout.polar = {
                    radialaxis: {
                        visible: true,
                        range: [0, 1],
                        gridcolor: gridColor,
                    },
                    angularaxis: {
                        gridcolor: gridColor,
                    },
                };
            }

            // Topic Distribution Bar Chart
            else if (nlpViewMode === "TOPIC_DISTRIBUTION") {
                const topicKeys = Object.keys(nlpData.topics || {});
                const topicVals = Object.values(nlpData.topics || {}).map(v => v * 100);

                traces.push({
                    type: "bar",
                    x: topicKeys,
                    y: topicVals,
                    marker: {
                        color: topicVals,
                        colorscale: "Blues",
                    },
                    name: "Topic Probability (%)",
                });
                layout.xaxis = { title: "Topic Domain", gridcolor: gridColor, tickangle: -25 };
                layout.yaxis = { title: "Probability (%)", gridcolor: gridColor, range: [0, 100] };
            }

            // Keyword Relevance Horizontal Bar Chart
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
                    name: "Semantic Relevance",
                });
                layout.xaxis = { title: "Relevance Score [0 - 1]", gridcolor: gridColor };
                layout.yaxis = { title: "Concept", gridcolor: gridColor };
            }

            // Word Frequency Bar Chart
            else if (nlpViewMode === "WORD_FREQUENCY") {
                const words = Object.keys(nlpData.word_frequency || {});
                const freqs = Object.values(nlpData.word_frequency || {});

                traces.push({
                    type: "bar",
                    x: words,
                    y: freqs,
                    marker: {
                        color: "#06b6d4",
                    },
                    name: "Term Frequency",
                });
                layout.xaxis = { title: "Term", gridcolor: gridColor };
                layout.yaxis = { title: "Occurrences", gridcolor: gridColor };
            }
        }

        // Default placeholder if empty
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
                filename: "graphx_visualization",
                height: 800,
                width: 1200,
                scale: 2,
            },
        };

        Plotly.react(containerRef.current, traces, layout, config);

        // Handle window resize
        const handleResize = () => {
            if (containerRef.current) {
                Plotly.Plots.resize(containerRef.current);
            }
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [mode, mathData, nlpData, colorscale, surfaceMode, nlpViewMode, selectedSentenceIndex, theme]);

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
        <div className="glass-panel rounded-2xl p-4 md:p-5 shadow-2xl border border-slate-800 space-y-3 flex flex-col h-full min-h-[500px]">
            {/* Top Controls Toolbar */}
            <GraphControls
                mode={mode}
                dimensionMode={dimensionMode}
                setDimensionMode={setDimensionMode}
                colorscale={colorscale}
                setColorscale={setColorscale}
                surfaceMode={surfaceMode}
                setSurfaceMode={setSurfaceMode}
                nlpViewMode={nlpViewMode}
                setNlpViewMode={setNlpViewMode}
                availableNlpViews={nlpData?.recommendation?.available_views || []}
                onResetView={handleResetView}
                onToggleFullscreen={handleToggleFullscreen}
                isFullscreen={isFullscreen}
                is3D={is3D}
            />

            {/* Plotly Canvas Container */}
            <div className="relative flex-1 w-full min-h-[440px] rounded-xl overflow-hidden bg-[#080d1a] border border-slate-800/80 flex items-center justify-center">
                {!hasData ? (
                    <div className="text-center p-8 space-y-3 max-w-md">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-slate-700 flex items-center justify-center">
                            <Compass className="w-8 h-8 text-cyan-400 animate-pulse" />
                        </div>
                        <h3 className="text-base font-bold text-slate-200">Interactive Visualization Canvas</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {mode === "equation"
                                ? 'Enter a mathematical equation or pick a preset above and click "Generate Graph" to render 1D curves, 2D Cartesian/implicit plots, or 3D interactive surfaces.'
                                : "Enter natural language text to compute deep Transformer embeddings, PCA/t-SNE/UMAP manifolds, sentiment arcs, and emotion distributions."}
                        </p>
                    </div>
                ) : (
                    <div ref={containerRef} className="w-full h-full" />
                )}
            </div>
        </div>
    );
};
