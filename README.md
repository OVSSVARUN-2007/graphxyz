# Graphx — AI-Powered Equation & Text-to-Graph Generator

An advanced, full-stack scientific application combining **Mathematics, LaTeX, NLP, Machine Learning, Deep Learning Transformer Neural Networks, Dimensionality Reduction (PCA, t-SNE, UMAP), and interactive 1D/2D/3D visualizations**.

---

## 🌟 Key Features

### Mode A: Mathematical Equation to Graph

- **LaTeX & Standard Math Editor**: Live real-time KaTeX rendering preview with instant syntax validation.
- **Quick Math Toolbar**: One-click insertions for $\frac{a}{b}$, $\sqrt{x}$, $x^2$, $x^n$, $\sin, \cos, \tan$, $\ln, \log, e^x$, $\pi, \theta, \phi, \infty$.
- **Automatic Detection**:
    - **1D Functions & 2D Explicit Curves**: $y = x^2 - 4x + 3$, $y = e^{-0.2x}\sin(3x)$, $y = \frac{1}{\sqrt{2\pi}}e^{-\frac{x^2}{2}}$
    - **2D Implicit Algebraic Curves**: $x^2 + y^2 = 25$, $x^3 + y^3 - 6xy = 0$ (Folium of Descartes), $(x^2+y^2)^2 = 2(x^2-y^2)$ (Lemniscate of Bernoulli)
    - **2D Polar Curves**: $r = 4\sin(4\theta)$ (Rose curve), $r = 3(1 - \cos\theta)$ (Cardioid), $r = 0.5\theta$ (Archimedean spiral)
    - **2D & 3D Parametric Curves**: $x = \cos(t), y = \sin(t)$, $x = \cos(t), y = \sin(t), z = 0.2t$ (3D Helix)
    - **3D Explicit Surfaces**: $z = \sin(x)\cos(y)$ (Wave ripple), $z = x^2 + y^2$ (Paraboloid), $z = x^2 - y^2$ (Saddle), $z = \frac{\sin(\sqrt{x^2+y^2})}{\sqrt{x^2+y^2}}$ (Sombrero)
    - **3D Implicit Isosurface Manifolds**: $x^2 + y^2 + z^2 = 25$ (Sphere), Torus rings
- **Analytical Insights**: Extrema calculation, domain ranges, mesh grid density, analytical derivative $f'(x)$.
- **Controls**: 3D Surface / Wireframe / Point Cloud modes, custom color palettes (Viridis, Plasma, Magma, Turbo, Electric, Cyan-Blue).

### Mode B: AI Natural Language Text-to-Graph

- **Deep Learning Neural Embeddings**: Encodes arbitrary text into 384-dimensional dense semantic vectors using a pre-trained Transformer (`all-MiniLM-L6-v2` via PyTorch).
- **Dimensionality Reduction**: Projects high-dimensional neural manifolds into interactive **2D and 3D coordinate spaces** using:
    - **PCA** (Principal Component Analysis)
    - **t-SNE** (t-Distributed Stochastic Neighbor Embedding)
    - **UMAP** (Uniform Manifold Approximation and Projection)
- **Sentence-by-Sentence Trajectory**: Segments multi-sentence narratives, traces sentiment arcs across sentences, and visualizes semantic paths alongside semantic knowledge landmarks.
- **Calibrated Sentiment Analysis**: Calculates probabilities for Positive, Neutral, Negative, and compound scores.
- **Emotion Intensity Spectrum**: Quantifies 7 discrete emotional states: Joy, Sadness, Anger, Fear, Surprise, Curiosity, Frustration.
- **Topic Modeling**: Zero-shot semantic alignment across 9 knowledge domains.
- **Key Concept & Frequency Extraction**: TF-IDF + semantic centrality rankings.
- **AI Model Transparency Panel**: Full disclosure of which algorithms are Deep Learning, Statistical ML, or rule-based, plus vector inspection (norm, sparsity, sample dimensions).
- **Visualization Recommendation Engine**: Automatically selects the optimal graph with natural language rationale.

### Presets & Export

- **Preset Gallery**: 20+ mathematical equations and 10+ AI text prompt scenarios.
- **Export Options**: High-resolution PNG (2K), Scalable Vector Graphic (SVG), raw JSON numerical coordinates and metadata.
- **History Drawer**: Automatic local history recording for instant query restoration.

---

## 🚀 Quick Start

### 1. Requirements

- Python 3.10+
- Node.js 18+ (Node.js 20+ recommended)

### 2. Run the Application

Simply execute the startup script:

```bash
./start.sh
```

Or start FastAPI manually:

```bash
python3 -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

Open your browser at:
👉 **`http://localhost:8000`**

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, PyTorch, Sentence-Transformers, SymPy, NumPy, SciPy, Scikit-Learn, UMAP-learn.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Plotly.js, KaTeX, Lucide React, Canvas Confetti.
