"""
FastAPI Backend Application for Graphx:
AI-Powered Equation and Text-to-Graph Generator.
"""

import os
import sys
from typing import Any, Dict, List, Optional, Tuple

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from math_engine import evaluate_equation, normalize_latex, parse_and_validate
from nlp_engine import HAS_TRANSFORMERS, HAS_UMAP, analyze_text
from pydantic import BaseModel, Field

app = FastAPI(
    title="Graphx AI Engine",
    description="Mathematical Equation & Deep Learning Text-to-Graph Generation API",
    version="1.0.0"
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
            dimension_override=req.dimension_override
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
        raise HTTPException(
            status_code=400,
            detail=f"NLP & Neural Analysis error: {str(e)}"
        )


# Mount Static Files from frontend dist if available
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


