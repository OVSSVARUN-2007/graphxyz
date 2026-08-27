import {
    DimensionMode,
    DimReductionMethod,
    MathEvaluateResponse,
    NLPanalyzeResponse,
    PresetEquation,
    PresetText,
} from "../types/graph";

const API_BASE = "/api";

export async function checkHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        if (!res.ok) throw new Error("Health check failed");
        return await res.json();
    } catch (err) {
        console.error("Health check failed:", err);
        return null;
    }
}

export async function fetchPresets(): Promise<{
    equations: PresetEquation[];
    texts: PresetText[];
}> {
    const res = await fetch(`${API_BASE}/presets`);
    if (!res.ok) {
        throw new Error("Failed to fetch presets");
    }
    return await res.json();
}

export interface CalculusOptions {
    show_tangent?: boolean;
    tangent_point?: number;
    show_integral?: boolean;
    integral_range?: [number, number];
    riemann_n?: number;
    show_extrema?: boolean;
}

export async function evaluateMath(
    equation: string,
    options?: {
        domain_ranges?: Record<string, [number, number]>;
        resolution?: number;
        dimension_override?: DimensionMode;
        parameters?: Record<string, number>;
        calculus_options?: CalculusOptions;
    },
): Promise<MathEvaluateResponse> {
    const res = await fetch(`${API_BASE}/math/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            equation,
            domain_ranges: options?.domain_ranges,
            resolution: options?.resolution || 200,
            dimension_override: options?.dimension_override || "AUTO",
            parameters: options?.parameters,
            calculus_options: options?.calculus_options,
        }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Mathematical evaluation failed");
    }
    return data;
}

export async function promptToMath(prompt: string): Promise<{
    equation: string;
    latex: string;
    title: string;
    dimension: DimensionMode;
    explanation: string;
    has_time?: boolean;
    suggested_ranges?: Record<string, [number, number]>;
}> {
    const res = await fetch(`${API_BASE}/ai/prompt-to-math`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Failed translating prompt to equation");
    }
    return data.result;
}

export async function evaluateMultipleMath(
    equations: string[],
    options?: {
        domain_ranges?: Record<string, [number, number]>;
        resolution?: number;
        dimension_override?: DimensionMode;
        parameters?: Record<string, number>;
    },
) {
    const res = await fetch(`${API_BASE}/math/multi-evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            equations,
            domain_ranges: options?.domain_ranges,
            resolution: options?.resolution || 200,
            dimension_override: options?.dimension_override || "AUTO",
            parameters: options?.parameters,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Multi-equation evaluation failed");
    return data;
}

export async function evaluateVectorField(
    field_u: string,
    field_v: string,
    field_w?: string,
    grid_size: number = 15,
    domain_range: number = 5.0,
) {
    const res = await fetch(`${API_BASE}/math/vector-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_u, field_v, field_w, grid_size, domain_range }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Vector field evaluation failed");
    return data;
}

export async function evaluateChaosSimulator(
    system: string = "lorenz",
    params?: Record<string, number>,
    num_points: number = 4000,
    dt: number = 0.01,
) {
    const res = await fetch(`${API_BASE}/math/chaos-simulator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, params, num_points, dt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Chaos simulation failed");
    return data;
}

export async function evaluateComplexAnalysis(
    functionStr: string = "z^2",
    grid_res: number = 80,
    domain: number = 3.0,
) {
    const res = await fetch(`${API_BASE}/math/complex-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: functionStr, grid_res, domain }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Complex analysis failed");
    return data;
}

export async function evaluate4DTesseract(angles?: Record<string, number>, distance: number = 3.0) {
    const res = await fetch(`${API_BASE}/math/4d-tesseract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angles, distance }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "4D Tesseract evaluation failed");
    return data;
}

export async function analyzeNLP(
    text: string,
    options?: {
        method?: DimReductionMethod;
        dimension_override?: DimensionMode;
    },
): Promise<NLPanalyzeResponse> {
    const res = await fetch(`${API_BASE}/nlp/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            text,
            method: options?.method || "PCA",
            dimension_override: options?.dimension_override || "AUTO",
        }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "NLP analysis failed");
    }
    return data;
}
