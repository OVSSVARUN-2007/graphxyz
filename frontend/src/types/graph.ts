export type AppMode = "equation" | "nlp";

export type DimensionMode = "AUTO" | "1D" | "2D" | "3D";

export type DimReductionMethod = "PCA" | "TSNE" | "UMAP";

export type PlotTypeOverride =
    | "AUTO"
    | "surface"
    | "wireframe"
    | "scatter3d"
    | "contour"
    | "scatter"
    | "bar"
    | "radar"
    | "pie";

// --- MATH TYPES ---

export interface MathParsedMeta {
    type: string;
    dimension: string;
    raw: string;
    normalized: string;
    expression_str?: string;
    dependent_var?: string;
    independent_vars?: string[];
    variables?: string[];
    parameter_vars?: string[];
    components?: Record<string, string>;
    value?: number;
}

export interface MathStats {
    min_y?: number;
    max_y?: number;
    mean_y?: number;
    r_min?: number;
    r_max?: number;
    theta_range?: [number, number];
    domain?: [number, number];
    derivative?: string | null;
    num_points?: number;
    grid_size?: string;
    x_domain?: [number, number];
    y_domain?: [number, number];
    z_min?: number;
    z_max?: number;
    vertices?: number;
    triangles?: number;
    points?: number;
}

export interface MathGraphData {
    type: string;
    dimension: string;
    metadata: MathParsedMeta;
    traces: any[];
    cartesian_trace?: any;
    stats: MathStats;
    layout_recommendations?: Record<string, any>;
}

export interface MathEvaluateResponse {
    success: boolean;
    equation: string;
    parsed: MathParsedMeta;
    data: MathGraphData;
}

// --- NLP TYPES ---

export interface SentimentData {
    positive: number;
    neutral: number;
    negative: number;
    compound_score: number;
    label: "Positive" | "Neutral" | "Negative";
}

export interface SentenceItem {
    index: number;
    text: string;
    sentiment: SentimentData;
    top_topic: string;
    word_count: number;
}

export interface KeywordItem {
    keyword: string;
    count: number;
    relevance: number;
    semantic_similarity: number;
}

export interface EmbeddingPoint {
    id: number;
    label: string;
    full_text: string;
    type: "document" | "sentence" | "anchor";
    category: string;
    x: number;
    y: number;
    z?: number;
}

export interface ModelInsights {
    model_architecture: string;
    embedding_dimensions: number;
    embedding_norm: number;
    embedding_sample_vector: number[];
    dimensionality_reduction: string;
    token_count: number;
    sentence_count: number;
    unique_tokens: number;
    lexical_diversity: number;
    components_breakdown: Record<string, string>;
}

export interface NLPRecommendation {
    recommended_visualization: string;
    rationale: string;
    available_views: string[];
}

export interface NLPAnalysisData {
    text: string;
    sentences: SentenceItem[];
    sentiment: SentimentData;
    emotions: Record<string, number>;
    topics: Record<string, number>;
    keywords: KeywordItem[];
    word_frequency: Record<string, number>;
    embeddings_2d: EmbeddingPoint[];
    embeddings_3d: EmbeddingPoint[];
    model_insights: ModelInsights;
    recommendation: NLPRecommendation;
}

export interface NLPanalyzeResponse {
    success: boolean;
    analysis: NLPAnalysisData;
}

// --- PRESETS & HISTORY ---

export interface PresetEquation {
    id: string;
    category: string;
    title: string;
    equation: string;
    dimension: string;
    description: string;
}

export interface PresetText {
    id: string;
    category: string;
    title: string;
    text: string;
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    mode: AppMode;
    input: string;
    title: string;
    dimension: string;
    resultSummary: string;
}
