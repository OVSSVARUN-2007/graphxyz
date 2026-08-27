import {
  DimensionMode,
  DimReductionMethod,
  MathEvaluateResponse,
  NLPanalyzeResponse,
  PresetEquation,
  PresetText,
} from "../types/graph";

// Dynamic API Base URL supporting VITE_API_BASE, VITE_API_URL, or window global config
const getApiBase = (): string => {
  if (typeof window !== "undefined" && (window as any).GRAPHX_API_BASE) {
    return (window as any).GRAPHX_API_BASE.replace(/\/$/, "");
  }
  const envBase =
    (import.meta as any).env?.VITE_API_BASE ||
    (import.meta as any).env?.VITE_API_URL ||
    "/api";
  return envBase.replace(/\/$/, "");
};

const API_BASE = getApiBase();

/**
 * Universal safe API caller that catches non-JSON HTML error pages (e.g. 404, 502, 504)
 * and formats human-readable error messages instead of crashing with "Unexpected token < or T in JSON".
 */
async function safeApiCall<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(
      `Network connection to API server failed at ${url}. If deployed on Vercel/Netlify, please configure your backend API server (e.g., set VITE_API_BASE in project settings).`
    );
  }

  // Inspect Content-Type header
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const rawText = await res.text();
    const cleanSnippet = rawText.replace(/<[^>]*>?/gm, "").trim().slice(0, 150);

    if (res.status === 404) {
      throw new Error(
        `Backend API endpoint not found (HTTP 404 at ${url}). If frontend is deployed separately, ensure backend is running and VITE_API_BASE is pointing to your active backend URL.`
      );
    } else if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        `Backend server is waking up or temporarily unavailable (HTTP ${res.status}). Please wait 10 seconds and try again.`
      );
    } else {
      throw new Error(
        `Server returned non-JSON response (HTTP ${res.status}): ${cleanSnippet || "Unknown error response"}`
      );
    }
  }

  let data: any;
  try {
    data = await res.json();
  } catch (jsonErr: any) {
    throw new Error(
      `Invalid JSON received from ${url}. The server may be restarting or misconfigured.`
    );
  }

  if (!res.ok) {
    const errorMsg =
      data.detail ||
      data.message ||
      data.error ||
      `Request failed with status ${res.status}`;
    throw new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
  }

  return data as T;
}

export async function checkHealth() {
  try {
    return await safeApiCall<{ status: string }>("/health");
  } catch (err) {
    console.warn("Health check notice:", err);
    return null;
  }
}

// Built-in fallback presets in case backend is offline during static frontend deployment
const FALLBACK_EQUATION_PRESETS: PresetEquation[] = [
  {
    id: "wave_ripple",
    title: "Wave Ripple Surface",
    equation: "z = \\sin(x) \\cos(y)",
    dimension: "3D",
    category: "3D Explicit Surfaces",
    description: "Harmonic orthogonal oscillating surface waves.",
  },
  {
    id: "hyperbolic_paraboloid",
    title: "Hyperbolic Paraboloid (Saddle)",
    equation: "z = x^2 - y^2",
    dimension: "3D",
    category: "3D Explicit Surfaces",
    description: "Classic minimax saddle geometry with opposing curvatures.",
  },
  {
    id: "mexican_hat",
    title: "Mexican Hat (Sombrero)",
    equation: "z = \\frac{\\sin(\\sqrt{x^2+y^2})}{\\sqrt{x^2+y^2}}",
    dimension: "3D",
    category: "3D Explicit Surfaces",
    description: "Radially symmetric 2D sinc function with concentric ripples.",
  },
  {
    id: "gaussian_bell",
    title: "Gaussian Bell Probability Curve",
    equation: "y = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{x^2}{2}}",
    dimension: "2D",
    category: "1D/2D Explicit Curves",
    description: "Standard normal distribution probability density function.",
  },
  {
    id: "damped_oscillator",
    title: "Damped Harmonic Oscillator",
    equation: "y = e^{-0.2x} \\sin(3x)",
    dimension: "2D",
    category: "1D/2D Explicit Curves",
    description: "Exponentially decaying sinusoidal oscillation in physical systems.",
  },
  {
    id: "folium_descartes",
    title: "Folium of Descartes",
    equation: "x^3 + y^3 - 6xy = 0",
    dimension: "2D",
    category: "2D Implicit Curves",
    description: "Classical loop curve with an oblique asymptote.",
  },
  {
    id: "rose_curve",
    title: "Rose Curve (4 Petals)",
    equation: "r = 4\\sin(4\\theta)",
    dimension: "2D",
    category: "2D Polar Curves",
    description: "Symmetric 8-lobed polar mathematical flower.",
  },
  {
    id: "parametric_helix",
    title: "3D Parametric Helix",
    equation: "x = \\cos(t), y = \\sin(t), z = 0.2t",
    dimension: "3D",
    category: "Parametric Curves",
    description: "Helical spiral curve extending along the z-axis.",
  },
];

const FALLBACK_TEXT_PRESETS: PresetText[] = [
  {
    id: "quantum_text",
    title: "Quantum Computing & Entanglement",
    text: "Quantum computing leverages quantum bits, superposition, and quantum entanglement to perform complex parallel computations that exponentially surpass classical computational paradigms.",
    category: "Quantum Physics & Computing",
  },
  {
    id: "dl_text",
    title: "Deep Learning & Neural Architectures",
    text: "Transformer neural networks employ multi-head self-attention mechanisms to map high-dimensional linguistic and perceptual representations across continuous latent manifolds.",
    category: "Machine Learning & AI",
  },
];

export async function fetchPresets(): Promise<{
  equations: PresetEquation[];
  texts: PresetText[];
}> {
  try {
    return await safeApiCall<{
      equations: PresetEquation[];
      texts: PresetText[];
    }>("/presets");
  } catch (err) {
    console.warn("Using offline fallback presets:", err);
    return {
      equations: FALLBACK_EQUATION_PRESETS,
      texts: FALLBACK_TEXT_PRESETS,
    };
  }
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
  }
): Promise<MathEvaluateResponse> {
  return await safeApiCall<MathEvaluateResponse>("/math/evaluate", {
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
  const data = await safeApiCall<{
    result: {
      equation: string;
      latex: string;
      title: string;
      dimension: DimensionMode;
      explanation: string;
      has_time?: boolean;
      suggested_ranges?: Record<string, [number, number]>;
    };
  }>("/ai/prompt-to-math", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return data.result;
}

export async function evaluateMultipleMath(
  equations: string[],
  options?: {
    domain_ranges?: Record<string, [number, number]>;
    resolution?: number;
    dimension_override?: DimensionMode;
    parameters?: Record<string, number>;
  }
): Promise<any> {
  return await safeApiCall("/math/multi-evaluate", {
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
}

export async function evaluateVectorField(
  field_u: string,
  field_v: string,
  field_w?: string,
  grid_size: number = 15,
  domain_range: number = 5.0
): Promise<any> {
  return await safeApiCall("/math/vector-field", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field_u, field_v, field_w, grid_size, domain_range }),
  });
}

export async function evaluateChaosSimulator(
  system: string = "lorenz",
  params?: Record<string, number>,
  num_points: number = 4000,
  dt: number = 0.01
): Promise<any> {
  return await safeApiCall("/math/chaos-simulator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, params, num_points, dt }),
  });
}

export async function evaluateComplexAnalysis(
  functionStr: string = "z^2",
  grid_res: number = 80,
  domain: number = 3.0
): Promise<any> {
  return await safeApiCall("/math/complex-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: functionStr, grid_res, domain }),
  });
}

export async function evaluate4DTesseract(
  angles?: Record<string, number>,
  distance: number = 3.0
): Promise<any> {
  return await safeApiCall("/math/4d-tesseract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ angles, distance }),
  });
}

export async function analyzeNLP(
  text: string,
  options?: {
    method?: DimReductionMethod;
    dimension_override?: DimensionMode;
  }
): Promise<NLPanalyzeResponse> {
  return await safeApiCall<NLPanalyzeResponse>("/nlp/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      method: options?.method || "PCA",
      dimension_override: options?.dimension_override || "AUTO",
    }),
  });
}

export async function evaluateQuantumOrbital(
  n: number = 2,
  l: number = 1,
  m: number = 0,
  grid_res: number = 35,
  box_size: number = 16.0,
  isopercentile: number = 90.0
): Promise<any> {
  return await safeApiCall("/math/quantum-orbital", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ n, l, m, grid_res, box_size, isopercentile }),
  });
}

export async function evaluateFractal(
  fractal_type: string = "mandelbrot",
  center_re: number = 0.0,
  center_im: number = 0.0,
  zoom: number = 1.0,
  max_iter: number = 100,
  julia_c: [number, number] = [-0.7, 0.27015],
  resolution: number = 100
): Promise<any> {
  return await safeApiCall("/math/fractal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fractal_type,
      center_re,
      center_im,
      zoom,
      max_iter,
      julia_c,
      res: resolution,
    }),
  });
}

export async function exportCode(equation: string, dimension: string = "3D"): Promise<any> {
  return await safeApiCall("/export/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equation, dimension }),
  });
}

export async function exportTikZ(equation: string): Promise<any> {
  return await safeApiCall("/export/tikz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equation }),
  });
}

export async function fetchGameChallenge(id?: string): Promise<any> {
  const url = id ? `/game/challenge?id=${id}` : `/game/challenge`;
  return await safeApiCall(url);
}

export async function submitGameGuess(
  challenge_id: string,
  player_equation: string
): Promise<any> {
  return await safeApiCall("/game/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id, player_equation }),
  });
}

export async function compareDualNLP(
  text1: string,
  text2: string,
  method: string = "PCA"
): Promise<any> {
  return await safeApiCall("/nlp/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text1, text2, method }),
  });
}

export async function uploadSnapshot(imageBase64: string): Promise<{ success: boolean; image_url: string; token: string }> {
  return await safeApiCall("/share/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
}

export async function evaluateNBody(
  preset: string = "three_body",
  num_steps: number = 600,
  dt: number = 0.015,
  G: number = 1.0
): Promise<any> {
  return await safeApiCall("/math/nbody", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preset, num_steps, dt, G }),
  });
}

export async function evaluateNeuralDNA(
  model_type: string = "neural_net",
  layers: number[] = [4, 8, 8, 3]
): Promise<any> {
  return await safeApiCall("/math/neural-dna", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_type, layers }),
  });
}

export async function fetchStepByStepDerivation(equation: string): Promise<any> {
  return await safeApiCall("/math/step-by-step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equation }),
  });
}
