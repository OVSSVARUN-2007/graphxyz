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
