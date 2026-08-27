"""
FastAPI Backend Application for Graphx:
AI-Powered Equation and Text-to-Graph Generator.
"""

import base64
import os
import sys
import uuid
from typing import Any, Dict, List, Optional, Tuple

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from math_engine import (evaluate_4d_tesseract, evaluate_chaos_simulator,
                         evaluate_complex_analysis, evaluate_equation,
                         evaluate_fractal, evaluate_game_guess,
                         evaluate_multiple_equations,
                         evaluate_nbody_simulation, evaluate_neural_dna_model,
                         evaluate_quantum_orbital,
                         evaluate_step_by_step_derivation,
                         evaluate_vector_field, generate_game_challenge,
                         generate_jupyter_notebook, generate_python_code,
                         generate_tikz_code, parse_and_validate,
                         prompt_to_equation)
from nlp_engine import HAS_TRANSFORMERS, HAS_UMAP, analyze_text
from pydantic import BaseModel, Field

# In-memory snapshot cache for public image link sharing
SNAPSHOT_CACHE: Dict[str, bytes] = {}

class SaveSnapshotRequest(BaseModel):
    image_base64: str

app = FastAPI(
    title="Graphxyz AI Engine",
    description="Mathematical Equation & Deep Learning Text-to-Graph Generation API",
    version="2.0.0"
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MathEvaluateRequest(BaseModel):
    equation: str = Field(..., example="z = sin(x)*cos(y)")
    domain_ranges: Optional[Dict[str, Tuple[float, float]]] = None
    resolution: Optional[int] = Field(200, ge=50, le=1000)
    dimension_override: Optional[str] = Field("AUTO", example="3D")
    parameters: Optional[Dict[str, float]] = None
    calculus_options: Optional[Dict[str, Any]] = None


class MultiMathEvaluateRequest(BaseModel):
    equations: List[str] = Field(..., example=["y = x^2", "y = 2*x + 3"])
    domain_ranges: Optional[Dict[str, Tuple[float, float]]] = None
    resolution: Optional[int] = Field(200, ge=50, le=1000)
    dimension_override: Optional[str] = Field("AUTO", example="2D")
    parameters: Optional[Dict[str, float]] = None


class VectorFieldRequest(BaseModel):
    field_u: str = Field(..., example="-y")
    field_v: str = Field(..., example="x")
    field_w: Optional[str] = Field(None, example="z")
    grid_size: Optional[int] = Field(15, ge=5, le=30)
    domain_range: Optional[float] = Field(5.0, ge=1.0, le=20.0)


class ChaosSimulatorRequest(BaseModel):
    system: str = Field("lorenz", example="lorenz")
    params: Optional[Dict[str, float]] = None
    num_points: Optional[int] = Field(4000, ge=500, le=15000)
    dt: Optional[float] = Field(0.01, ge=0.001, le=0.05)


class ComplexAnalysisRequest(BaseModel):
    function: str = Field("z^2 - 1", example="z^3 - 1")
    grid_res: Optional[int] = Field(80, ge=30, le=200)
    domain: Optional[float] = Field(3.0, ge=0.5, le=10.0)


class TesseractRequest(BaseModel):
    angles: Optional[Dict[str, float]] = None
    distance: Optional[float] = Field(3.0, ge=1.5, le=10.0)


class QuantumOrbitalRequest(BaseModel):
    n: int = Field(2, ge=1, le=4)
    l: int = Field(1, ge=0, le=3)
    m: int = Field(0, ge=-3, le=3)
    grid_res: Optional[int] = Field(35, ge=20, le=60)
    box_size: Optional[float] = Field(16.0, ge=5.0, le=30.0)
    isopercentile: Optional[float] = Field(90.0, ge=50.0, le=99.0)


class FractalRequest(BaseModel):
    fractal_type: str = Field("mandelbrot", example="mandelbrot")
    center_re: Optional[float] = Field(0.0)
    center_im: Optional[float] = Field(0.0)
    zoom: Optional[float] = Field(1.0, ge=0.1, le=10000.0)
    max_iter: Optional[int] = Field(100, ge=20, le=300)
    julia_c: Optional[List[float]] = Field([-0.7, 0.27015])
    res: Optional[int] = Field(100, ge=40, le=200)


class ExportCodeRequest(BaseModel):
    equation: str = Field(..., example="z = sin(x)*cos(y)")
    dimension: Optional[str] = Field("3D", example="3D")
    format: Optional[str] = Field("python", example="python")


class GameGuessRequest(BaseModel):
    challenge_id: str = Field("1")
    player_equation: str = Field(..., example="y = 2*x - 3")


class DualNLPCompareRequest(BaseModel):
    text1: str = Field(..., example="Artificial intelligence will improve society and foster innovation.")
    text2: str = Field(..., example="Unregulated AI creates existential risks, biases, and job displacement.")
    method: Optional[str] = Field("PCA")


class NBodyRequest(BaseModel):
    preset: Optional[str] = Field("three_body", example="three_body")
    num_steps: Optional[int] = Field(600, ge=100, le=2000)
    dt: Optional[float] = Field(0.015, ge=0.001, le=0.1)
    G: Optional[float] = Field(1.0, ge=0.1, le=10.0)


class NeuralDNARequest(BaseModel):
    model_type: Optional[str] = Field("neural_net", example="neural_net")
    layers: Optional[List[int]] = Field([4, 8, 8, 3])


class StepByStepRequest(BaseModel):
    equation: str = Field(..., example="x^3 - 3*x + 1")


class PromptToMathRequest(BaseModel):
    prompt: str = Field(..., example="Draw a 3D saddle that looks like a Pringle potato chip")


class NLPanalyzeRequest(BaseModel):
    text: str = Field(..., example="Artificial intelligence and neural networks are transforming science.")
    method: Optional[str] = Field("PCA", example="PCA")
    dimension_override: Optional[str] = Field("AUTO", example="3D")


# Rich Presets Library
PRESETS_EQUATIONS = [
    # 1D / 2D Explicit
    {"id": "parabola", "category": "1D / 2D Explicit", "title": "Quadratic Parabola", "equation": "y = x^2 - 4x + 3", "dimension": "2D", "description": "Standard polynomial parabola with roots and vertex"},
    {"id": "sine_wave", "category": "1D / 2D Explicit", "title": "Damped Sine Wave", "equation": "y = e^{-0.2x} \\sin(3x)", "dimension": "2D", "description": "Exponentially decaying oscillatory signal"},
    {"id": "gaussian", "category": "1D / 2D Explicit", "title": "Gaussian Bell Curve", "equation": "y = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{x^2}{2}}", "dimension": "2D", "description": "Standard normal distribution density function"},
    {"id": "rational", "category": "1D / 2D Explicit", "title": "Rational Function with Asymptotes", "equation": "y = \\frac{x^2 - 1}{x^2 - 4}", "dimension": "2D", "description": "Rational curve showing vertical & horizontal asymptotes"},
    {"id": "weierstrass_approx", "category": "1D / 2D Explicit", "title": "Harmonic Fourier Wave", "equation": "y = \\sin(x) + \\frac{1}{3}\\sin(3x) + \\frac{1}{5}\\sin(5x)", "dimension": "2D", "description": "Square wave Fourier series approximation"},

    # Complex / Identity
    {"id": "euler_identity", "category": "Complex / Identity", "title": "Euler's Identity (Argand & Phasor)", "equation": "e^{i\\pi} + 1 = 0", "dimension": "2D", "description": "The most beautiful equation in mathematics linking e, i, pi, 1, and 0"},
    {"id": "euler_formula", "category": "Complex / Identity", "title": "Euler's Phasor Formula", "equation": "e^{ix}", "dimension": "2D", "description": "Complex exponential decomposition into cosine and sine harmonics"},

    # 2D Implicit
    {"id": "circle", "category": "2D Implicit", "title": "Concentric Circle", "equation": "x^2 + y^2 = 25", "dimension": "2D", "description": "Circle of radius 5 centered at origin"},
    {"id": "folium", "category": "2D Implicit", "title": "Folium of Descartes", "equation": "x^3 + y^3 - 6xy = 0", "dimension": "2D", "description": "Famous algebraic loop curve investigated by Descartes"},
    {"id": "lemniscate", "category": "2D Implicit", "title": "Lemniscate of Bernoulli", "equation": "(x^2 + y^2)^2 = 2(x^2 - y^2)", "dimension": "2D", "description": "Infinity-shaped algebraic curve"},
    {"id": "cassini", "category": "2D Implicit", "title": "Cassini Oval", "equation": "((x-2)^2 + y^2) * ((x+2)^2 + y^2) = 17", "dimension": "2D", "description": "Bipolar geometric loci curve"},

    # Polar
    {"id": "rose_curve", "category": "2D Polar", "title": "8-Petal Rose Curve", "equation": "r = 4\\sin(4\\theta)", "dimension": "2D", "description": "Harmonic polar petal rosette"},
    {"id": "cardioid", "category": "2D Polar", "title": "Cardioid Heart", "equation": "r = 3(1 - \\cos(\\theta))", "dimension": "2D", "description": "Heart-shaped polar epicycloid"},
    {"id": "archimedes_spiral", "category": "2D Polar", "title": "Archimedean Spiral", "equation": "r = 0.5\\theta", "dimension": "2D", "description": "Equidistant spiral curve"},
    {"id": "butterfly_polar", "category": "2D Polar", "title": "Butterfly Curve", "equation": "r = e^{\\cos(\\theta)} - 2\\cos(4\\theta) + \\sin(\\frac{\\theta}{12})^5", "dimension": "2D", "description": "Temple H. Fay's transcendental butterfly curve"},

    # Parametric
    {"id": "lissajous", "category": "2D Parametric", "title": "Lissajous Figure", "equation": "x = \\sin(3t), y = \\sin(4t)", "dimension": "2D", "description": "Harmonic motion interference pattern"},
    {"id": "astroid", "category": "2D Parametric", "title": "Astroid Hypocycloid", "equation": "x = \\cos(t)^3, y = \\sin(t)^3", "dimension": "2D", "description": "4-cusped hypocycloid"},
    {"id": "helix_3d", "category": "3D Parametric", "title": "3D Helical Spiral", "equation": "x = \\cos(t), y = \\sin(t), z = 0.2t", "dimension": "3D", "description": "3D circular helix coil in Euclidean space"},

    # 3D Surfaces
    {"id": "ripple_3d", "category": "3D Surface", "title": "2D Wave Interference (Ripple)", "equation": "z = \\sin(x)\\cos(y)", "dimension": "3D", "description": "Cross-product sinusoidal interference surface"},
    {"id": "paraboloid_3d", "category": "3D Surface", "title": "Elliptic Paraboloid", "equation": "z = x^2 + y^2", "dimension": "3D", "description": "Bowl-shaped quadratic surface with central minimum"},
    {"id": "saddle_3d", "category": "3D Surface", "title": "Hyperbolic Paraboloid (Saddle)", "equation": "z = x^2 - y^2", "dimension": "3D", "description": "Minimax saddle pass surface"},
    {"id": "sombrero_3d", "category": "3D Surface", "title": "Mexican Hat / Sombrero Wave", "equation": "z = \\frac{\\sin(\\sqrt{x^2 + y^2})}{\\sqrt{x^2 + y^2} + 0.01}", "dimension": "3D", "description": "Radially symmetric Airy/Bessel diffraction pattern"},
    {"id": "monkey_saddle", "category": "3D Surface", "title": "Monkey Saddle", "equation": "z = x^3 - 3xy^2", "dimension": "3D", "description": "Saddle surface with three downward dips for legs and tail"},
    {"id": "gaussian_3d", "category": "3D Surface", "title": "Bivariate Gaussian Surface", "equation": "z = 5 e^{-(0.2x^2 + 0.2y^2)}", "dimension": "3D", "description": "2D Gaussian normal distribution surface"},

    # 3D Implicit
    {"id": "sphere_3d", "category": "3D Implicit", "title": "3D Sphere Isosurface", "equation": "x^2 + y^2 + z^2 = 25", "dimension": "3D", "description": "Closed spherical manifold of radius 5"},
    {"id": "torus_3d", "category": "3D Implicit", "title": "3D Torus Ring", "equation": "(x^2 + y^2 + z^2 + 16 - 4)^2 - 64(x^2 + y^2) = 0", "dimension": "3D", "description": "Donut-shaped algebraic torus isosurface"},
]

PRESETS_TEXTS = [
    {
        "id": "ai_student",
        "title": "AI & Computer Science Passion",
        "category": "Academic & Tech",
        "text": "Hello, I am a student and I love programming, artificial intelligence, physics and technology. Learning how deep neural networks process information inspires me to create new algorithms every day."
    },
    {
        "id": "emotional_journey",
        "title": "Developer Journey: Joy & Frustration",
        "category": "Emotional Narrative",
        "text": "Today was a wonderful day. I am happy and excited about starting my new software project. However, debugging complex memory leaks in distributed systems can be exhausting and frustrating. In the end, finding the root cause brought immense satisfaction and peace."
    },
    {
        "id": "deep_tech_revolution",
        "title": "The Machine Learning Revolution",
        "category": "Technology & Industry",
        "text": "Artificial intelligence is growing rapidly across the globe. Machine learning and deep learning are becoming foundational technologies in healthcare, finance, climate modeling, and robotics. Modern Transformer architectures enable computers to comprehend natural language and discover novel scientific insights."
    },
    {
        "id": "cosmos_physics",
        "title": "Quantum Reality and the Universe",
        "category": "Physics & Philosophy",
        "text": "The universe is governed by profound mathematical symmetries. Quantum mechanics reveals that matter behaves as both particles and wavefunctions. Astrophysics and general relativity describe black holes, gravitational waves, and the cosmic expansion of spacetime."
    },
    {
        "id": "startup_pitch",
        "title": "Venture Startup Strategy",
        "category": "Business & Strategy",
        "text": "Our enterprise SaaS startup is scaling user acquisition rapidly. We closed our Series A financing round with strong venture capital backing. Building high-retention product features while maximizing operational efficiency is our core quarterly objective."
    },
]


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Graphx AI Equation & Text-to-Graph Engine",
        "engine_status": {
            "sentence_transformers": HAS_TRANSFORMERS,
            "umap_available": HAS_UMAP,
            "backend_framework": "FastAPI + PyTorch + Sympy + Scikit-Learn",
        }
    }


@app.get("/api/presets")
def get_presets():
    return {
        "equations": PRESETS_EQUATIONS,
        "texts": PRESETS_TEXTS,
    }


@app.post("/api/math/evaluate")
def evaluate_math_endpoint(req: MathEvaluateRequest):
    try:
        parsed = parse_and_validate(req.equation)
        graph_data = evaluate_equation(
            parsed_meta=parsed,
            domain_ranges=req.domain_ranges,
            resolution=req.resolution or 200,
            dimension_override=req.dimension_override,
            parameters=req.parameters,
            calculus_options=req.calculus_options,
        )
        parsed_clean = {k: v for k, v in parsed.items() if not k.startswith("sympy_")}
        return {
            "success": True,
            "equation": req.equation,
            "parsed": parsed_clean,
            "data": graph_data,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=400,
            detail=f"Mathematical evaluation error: {str(e)}"
        )


@app.post("/api/math/multi-evaluate")
def multi_evaluate_math_endpoint(req: MultiMathEvaluateRequest):
    try:
        data = evaluate_multiple_equations(
            equations=req.equations,
            domain_ranges=req.domain_ranges,
            resolution=req.resolution or 200,
            dimension_override=req.dimension_override or "AUTO",
            parameters=req.parameters,
        )
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=400,
            detail=f"Multi-equation evaluation error: {str(e)}"
        )


@app.post("/api/math/vector-field")
def vector_field_endpoint(req: VectorFieldRequest):
    try:
        data = evaluate_vector_field(
            field_u=req.field_u,
            field_v=req.field_v,
            field_w=req.field_w,
            grid_size=req.grid_size or 15,
            domain_range=req.domain_range or 5.0,
        )
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Vector field error: {str(e)}"
        )


@app.post("/api/math/chaos-simulator")
def chaos_simulator_endpoint(req: ChaosSimulatorRequest):
    try:
        data = evaluate_chaos_simulator(
            system_name=req.system or "lorenz",
            params=req.params,
            num_points=req.num_points or 4000,
            dt=req.dt or 0.01,
        )
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Chaos simulation error: {str(e)}"
        )


@app.post("/api/math/complex-analysis")
def complex_analysis_endpoint(req: ComplexAnalysisRequest):
    try:
        data = evaluate_complex_analysis(
            func_str=req.function or "z^2",
            grid_res=req.grid_res or 80,
            domain=req.domain or 3.0,
        )
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Complex analysis error: {str(e)}"
        )


@app.post("/api/math/4d-tesseract")
def tesseract_endpoint(req: TesseractRequest):
    try:
        data = evaluate_4d_tesseract(
            angles=req.angles,
            distance=req.distance or 3.0,
        )
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"4D Tesseract error: {str(e)}"
        )


@app.post("/api/ai/prompt-to-math")
def prompt_to_math_endpoint(req: PromptToMathRequest):
    try:
        res = prompt_to_equation(req.prompt)
        return {
            "success": True,
            "prompt": req.prompt,
            "result": res,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Prompt to math translation error: {str(e)}"
        )


@app.post("/api/nlp/analyze")
def analyze_nlp_endpoint(req: NLPanalyzeRequest):
    try:
        result = analyze_text(
            text=req.text,
            dim_reduction_method=req.method or "PCA",
            dimension_override=req.dimension_override
        )
        return {
            "success": True,
            "analysis": result,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
@app.post("/api/math/quantum-orbital")
def quantum_orbital_endpoint(req: QuantumOrbitalRequest):
    try:
        data = evaluate_quantum_orbital(
            n=req.n,
            l=req.l,
            m=req.m,
            grid_res=req.grid_res or 35,
            box_size=req.box_size or 16.0,
            isopercentile=req.isopercentile or 90.0,
        )
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=400,
            detail=f"Quantum orbital simulation error: {str(e)}"
        )


@app.post("/api/math/fractal")
def fractal_endpoint(req: FractalRequest):
    try:
        data = evaluate_fractal(
            fractal_type=req.fractal_type,
            center_re=req.center_re or 0.0,
            center_im=req.center_im or 0.0,
            zoom=req.zoom or 1.0,
            max_iter=req.max_iter or 100,
            julia_c=tuple(req.julia_c) if req.julia_c else (-0.7, 0.27015),
            res=req.res or 100,
        )
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Fractal computation error: {str(e)}"
        )


@app.post("/api/export/code")
def export_code_endpoint(req: ExportCodeRequest):
    try:
        py_code = generate_python_code(req.equation, req.dimension or "3D")
        nb_json = generate_jupyter_notebook(req.equation, req.dimension or "3D")
        return {
            "success": True,
            "python_code": py_code,
            "jupyter_notebook": nb_json,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Code generation error: {str(e)}"
        )


@app.post("/api/export/tikz")
def export_tikz_endpoint(req: ExportCodeRequest):
    try:
        tikz = generate_tikz_code(req.equation)
        return {
            "success": True,
            "tikz_code": tikz,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"TikZ generation error: {str(e)}"
        )


@app.get("/api/game/challenge")
def game_challenge_endpoint(id: Optional[str] = None):
    try:
        ch = generate_game_challenge(id)
        return {
            "success": True,
            "data": ch,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Game challenge error: {str(e)}"
        )


@app.post("/api/game/guess")
def game_guess_endpoint(req: GameGuessRequest):
    try:
        res = evaluate_game_guess(req.challenge_id, req.player_equation)
        return {
            "success": True,
            "data": res,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Guess evaluation error: {str(e)}"
        )


@app.post("/api/nlp/compare")
def compare_nlp_endpoint(req: DualNLPCompareRequest):
    try:
        r1 = analyze_text(req.text1, dim_reduction_method=req.method or "PCA")
        r2 = analyze_text(req.text2, dim_reduction_method=req.method or "PCA")
        return {
            "success": True,
            "doc1": r1,
            "doc2": r2,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Dual NLP comparison error: {str(e)}"
        )


@app.post("/api/math/nbody")
def nbody_simulation_endpoint(req: NBodyRequest):
    try:
        data = evaluate_nbody_simulation(
            preset=req.preset or "three_body",
            num_steps=req.num_steps or 600,
            dt=req.dt or 0.015,
            G=req.G or 1.0,
        )
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"N-Body simulation error: {str(e)}"
        )


@app.post("/api/math/neural-dna")
def neural_dna_endpoint(req: NeuralDNARequest):
    try:
        data = evaluate_neural_dna_model(
            model_type=req.model_type or "neural_net",
            layer_sizes=req.layers or [4, 8, 8, 3],
        )
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Neural/DNA model error: {str(e)}"
        )


@app.post("/api/math/step-by-step")
def step_by_step_endpoint(req: StepByStepRequest):
    try:
        res = evaluate_step_by_step_derivation(req.equation)
        return {
            "success": True,
            "data": res,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Step-by-step calculus error: {str(e)}"
        )


@app.post("/api/share/snapshot")
def save_snapshot_endpoint(req: SaveSnapshotRequest):
    try:
        raw_b64 = req.image_base64
        if "base64," in raw_b64:
            raw_b64 = raw_b64.split("base64,")[1]
        img_bytes = base64.b64decode(raw_b64)
        token = str(uuid.uuid4())[:8]
        SNAPSHOT_CACHE[token] = img_bytes
        if len(SNAPSHOT_CACHE) > 100:
            oldest = list(SNAPSHOT_CACHE.keys())[0]
            del SNAPSHOT_CACHE[oldest]
        return {
            "success": True,
            "token": token,
            "image_url": f"/api/share/snapshot/{token}.png"
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Snapshot upload error: {str(e)}"
        )


@app.get("/api/share/snapshot/{token}")
@app.get("/api/share/snapshot/{token}.png")
def get_snapshot_endpoint(token: str):
    clean_token = token.replace(".png", "")
    if clean_token not in SNAPSHOT_CACHE:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return Response(content=SNAPSHOT_CACHE[clean_token], media_type="image/png")


# Mount Static Files from frontend dist if available
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


