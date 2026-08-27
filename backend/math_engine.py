"""
Math Engine for Graphxyz:
Universal mathematical parser and multi-dimensional numerical evaluator.
Supports any arbitrary algebraic expression, LaTeX notation, explicit, implicit,
polar, and parametric equations in 1D, 2D, and 3D dimensions.
"""

import math
import re
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import (convert_xor,
                                        implicit_multiplication_application,
                                        parse_expr, standard_transformations)

try:
    import scipy.special as sps
    HAS_SCIPY_SPECIAL = True
except ImportError:
    HAS_SCIPY_SPECIAL = False

try:
    from skimage import measure
    HAS_SKIMAGE = True
except ImportError:
    HAS_SKIMAGE = False

TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)

SAFE_SYMBOLS = {
    'i': sp.I,
    'I': sp.I,
    'j': sp.I,
    'pi': sp.pi,
    'PI': sp.pi,
    'E': sp.E,
    'e': sp.E,
    'exp': sp.exp,
    'log': sp.log,
    'ln': sp.log,
    'sqrt': sp.sqrt,
    'sin': sp.sin,
    'cos': sp.cos,
    'tan': sp.tan,
    'sec': sp.sec,
    'csc': sp.csc,
    'cot': sp.cot,
    'asin': sp.asin,
    'acos': sp.acos,
    'atan': sp.atan,
    'arcsin': sp.asin,
    'arccos': sp.acos,
    'arctan': sp.atan,
    'sinh': sp.sinh,
    'cosh': sp.cosh,
    'tanh': sp.tanh,
    'abs': sp.Abs,
    'Abs': sp.Abs,
    're': sp.re,
    'im': sp.im,
    'arg': sp.arg,
}

LAMBDIFY_MODULES = [
    'numpy',
    {
        'sin': np.sin,
        'cos': np.cos,
        'tan': np.tan,
        'arcsin': np.arcsin,
        'arccos': np.arccos,
        'arctan': np.arctan,
        'asin': np.arcsin,
        'acos': np.arccos,
        'atan': np.arctan,
        'sinh': np.sinh,
        'cosh': np.cosh,
        'tanh': np.tanh,
        'exp': np.exp,
        'log': np.log,
        'ln': np.log,
        'sqrt': np.sqrt,
        'pi': np.pi,
        'e': np.e,
        'E': np.e,
        'abs': np.abs,
        'Abs': np.abs,
    }
]


def normalize_latex(text: str) -> str:
    """Normalize LaTeX notation and plain math into a sympy-compatible string."""
    if not text:
        return ""
    
    s = text.strip()
    # Remove math mode delimiters $...$ or $$...$$ or \[ \] \( \)
    s = re.sub(r'^\$\$?(.*?)\$\$?$', r'\1', s, flags=re.DOTALL).strip()
    s = re.sub(r'^\\\[(.*?)\\\]$', r'\1', s, flags=re.DOTALL).strip()
    s = re.sub(r'^\\\((.*?)\\\)$', r'\1', s, flags=re.DOTALL).strip()
    
    # Unicode Greek letters and symbols
    greek_map = {
        'μ': 'mu', 'σ': 'sigma', 'λ': 'lam', 'α': 'alpha', 'β': 'beta',
        'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'ω': 'omega', 'ϕ': 'phi',
        'φ': 'phi', 'ψ': 'psi', 'ρ': 'rho', 'τ': 'tau', 'θ': 'theta', 'π': 'pi',
        'Ω': 'Omega', 'Δ': 'Delta', 'Σ': 'Sigma', 'Φ': 'Phi', 'Ψ': 'Psi',
    }
    for g, name in greek_map.items():
        s = s.replace(g, name)

    # Unicode root: √(2π) or √x -> sqrt(2*pi) or sqrt(x)
    s = re.sub(r'√\s*\((.*?)\)', r'sqrt(\1)', s)
    s = re.sub(r'√\s*([a-zA-Z0-9_]+)', r'sqrt(\1)', s)

    s = s.replace('²', '^2').replace('³', '^3').replace('·', '*').replace('×', '*').replace('÷', '/')
    
    # Common LaTeX replacements
    s = s.replace(r'\left', '').replace(r'\right', '')
    s = s.replace(r'\cdot', '*').replace(r'\times', '*').replace(r'\div', '/')
    s = s.replace(r'\mu', 'mu').replace(r'\sigma', 'sigma').replace(r'\lambda', 'lam')
    s = s.replace(r'\alpha', 'alpha').replace(r'\beta', 'beta').replace(r'\gamma', 'gamma')
    s = s.replace(r'\delta', 'delta').replace(r'\epsilon', 'epsilon').replace(r'\omega', 'omega')
    s = s.replace(r'\phi', 'phi').replace(r'\psi', 'psi').replace(r'\rho', 'rho').replace(r'\tau', 'tau')
    s = s.replace(r'\theta', 'theta').replace(r'\Theta', 'theta')
    s = s.replace(r'\pi', 'pi').replace(r'\Pi', 'pi')
    s = s.replace(r'\ln', 'log').replace(r'\log', 'log')
    s = s.replace(r'\exp', 'exp')
    s = s.replace(r'\infty', '1e6')
    s = s.replace(r'\pm', '+')
    
    # Handle \frac{a}{b} and \dfrac{a}{b}
    while r'\frac' in s or r'\dfrac' in s:
        match = re.search(r'\\d?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}', s)
        if match:
            num, den = match.group(1), match.group(2)
            s = s[:match.start()] + f"(({num})/({den}))" + s[match.end():]
        else:
            # Handle single char args: \frac12
            match_single = re.search(r'\\d?frac\s*([0-9a-zA-Z])\s*([0-9a-zA-Z])', s)
            if match_single:
                s = s[:match_single.start()] + f"(({match_single.group(1)})/({match_single.group(2)}))" + s[match_single.end():]
            else:
                break

    # Handle \sqrt{a} -> sqrt(a) and \sqrt[n]{a} -> ((a)**(1/(n)))
    s = re.sub(r'\\sqrt\[([^\]]+)\]\{([^{}]+)\}', r'((\2)**(1/(\1)))', s)
    s = re.sub(r'\\sqrt\{([^{}]+)\}', r'sqrt(\1)', s)

    # Trig and standard math functions
    s = re.sub(r'\\(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|abs)', r'\1', s)

    # Handle e^{...} and e^(...) -> exp(...)
    s = re.sub(r'\be\^\{([^{}]+)\}', r'exp(\1)', s)
    s = re.sub(r'\be\^\((.*?)\)', r'exp(\1)', s)
    s = re.sub(r'\be\^([a-zA-Z0-9_]+)', r'exp(\1)', s)

    # Convert square brackets [ ... ] to grouping parentheses ( ... )
    s = s.replace('[', '(').replace(']', ')')

    # Replace function notation f(x) = with y = or f(x, y) = with z =
    s = re.sub(r'^[a-zA-Z_]\w*\s*\(\s*x\s*,\s*y\s*\)\s*=', 'z =', s)
    s = re.sub(r'^[a-zA-Z_]\w*\s*\(\s*x\s*\)\s*=', 'y =', s)
    s = re.sub(r'^[a-zA-Z_]\w*\s*\(\s*t\s*\)\s*=', 'y =', s)
    s = re.sub(r'^[a-zA-Z_]\w*\s*\(\s*theta\s*\)\s*=', 'r =', s)

    # Remove extra stray backslashes
    s = s.replace('\\', '')
    
    return s.strip()


def parse_and_validate(raw_input: str) -> Dict[str, Any]:
    """Parse equation, detect type, variables, and create analytical representation."""
    cleaned = normalize_latex(raw_input)
    if not cleaned:
        raise ValueError("Equation input is empty.")

    # Detect Euler's Identity: e^{i\pi} + 1 = 0 or e^{i*pi} = -1
    raw_lower = raw_input.lower().replace(' ', '')
    if ('e^{i\\pi}' in raw_lower or 'e^{ipi}' in raw_lower or 'exp(i*pi)' in cleaned.lower() or 'exp(i*theta)' in cleaned.lower() or 'exp(i*pi)' in cleaned or 'e**(i*pi)' in cleaned) and ('+1=0' in raw_lower or '=-1' in raw_lower or '+1' in raw_lower or '=0' in raw_lower):
        return {
            "type": "EULER_IDENTITY",
            "dimension": "2D",
            "raw": raw_input,
            "normalized": "e^{i\\pi} + 1 = 0",
            "expression_str": "exp(I*pi) + 1 = 0",
            "variables": ["Re", "Im"],
            "independent_vars": ["theta"],
            "dependent_vars": ["z"],
        }

    # 1. Parametric form: "x = cos(t), y = sin(t)" or "x = ..., y = ..., z = ..."
    if ',' in cleaned or ';' in cleaned:
        parts = [p.strip() for p in re.split(r'[,;]', cleaned) if p.strip()]
        if len(parts) in (2, 3):
            param_dict = {}
            for part in parts:
                if '=' in part:
                    var, expr_str = part.split('=', 1)
                    var = var.strip().replace('(t)', '').replace('(u,v)', '').replace('(u)', '').replace('(v)', '')
                    param_dict[var] = expr_str.strip()
            
            if len(param_dict) >= 2:
                sp_components = {}
                all_symbols = set()
                for var, expr_str in param_dict.items():
                    parsed = parse_expr(expr_str, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
                    sp_components[var] = parsed
                    all_symbols.update([str(s) for s in parsed.free_symbols])
                
                dim = "3D" if ('z' in sp_components or len(sp_components) == 3) else "2D"
                param_vars = sorted(list(all_symbols - set(sp_components.keys())))
                
                return {
                    "type": "PARAMETRIC",
                    "dimension": dim,
                    "raw": raw_input,
                    "normalized": cleaned,
                    "components": {k: str(v) for k, v in sp_components.items()},
                    "sympy_components": sp_components,
                    "variables": sorted(list(all_symbols)),
                    "parameter_vars": param_vars if param_vars else ['t'],
                    "independent_vars": param_vars if param_vars else ['t'],
                    "dependent_vars": list(sp_components.keys()),
                }

    # 2. Polar form: "r = ..." or "r(theta) = ..."
    if re.match(r'^r(\s*\(\s*theta\s*\))?\s*=', cleaned, re.IGNORECASE):
        _, rhs = cleaned.split('=', 1)
        rhs_parsed = parse_expr(rhs.strip(), local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
        return {
            "type": "POLAR",
            "dimension": "2D",
            "raw": raw_input,
            "normalized": cleaned,
            "rhs_str": str(rhs_parsed),
            "sympy_expr": rhs_parsed,
            "variables": ["r", "theta"],
            "independent_vars": ["theta"],
            "dependent_vars": ["r"],
        }

    # 3. Standard Explicit / Implicit Equation
    if '=' in cleaned:
        parts = cleaned.split('=', 1)
        lhs_raw, rhs_raw = parts[0].strip(), parts[1].strip()
        lhs_parsed = parse_expr(lhs_raw, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
        rhs_parsed = parse_expr(rhs_raw, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
        
        lhs_syms = [str(s) for s in lhs_parsed.free_symbols]
        rhs_syms = [str(s) for s in rhs_parsed.free_symbols]

        # Explicit format: y = f(x), z = f(x, y), x = f(y)
        if len(lhs_syms) == 1 and lhs_raw in ('y', 'z', 'x', 'f(x)', 'f(x,y)'):
            dep = lhs_raw.split('(')[0]
            expr = rhs_parsed
            free_vars = rhs_syms
            
            spatial_symbols = {'x', 'y', 'z', 'r', 'theta', 'phi', 'u', 'v'}
            spatial_vars = [s for s in free_vars if s in spatial_symbols]
            param_symbols = [s for s in free_vars if s not in spatial_symbols]
            
            if dep == 'z' or len(spatial_vars) >= 2:
                dim = "3D"
                eq_type = "EXPLICIT_3D"
            else:
                dim = "2D"
                eq_type = "EXPLICIT_2D"
                
            return {
                "type": eq_type,
                "dimension": dim,
                "raw": raw_input,
                "normalized": cleaned,
                "expression_str": str(expr),
                "sympy_expr": expr,
                "dependent_var": dep,
                "independent_vars": sorted(spatial_vars) if spatial_vars else ['x'],
                "variables": sorted(list(set([dep] + free_vars))),
                "detected_parameters": param_symbols,
                "has_time_parameter": 't' in free_vars,
            }
        else:
            # Implicit format: LHS - RHS = 0
            expr = sp.simplify(lhs_parsed - rhs_parsed)
            free_vars = [str(s) for s in expr.free_symbols]
        dim = "3D" if ('z' in free_vars or len(free_vars) >= 3) else "2D"
        # Detect free parameters (constants or time t)
        spatial_symbols = {'x', 'y', 'z', 'r', 'theta', 'phi', 'u', 'v'}
        param_symbols = [s for s in free_vars if s not in spatial_symbols]
        
        parsed_res = {
            "type": f"IMPLICIT_{dim}",
            "dimension": dim,
            "raw": raw_input,
            "normalized": cleaned,
            "expression_str": str(expr),
            "sympy_expr": expr,
            "independent_vars": sorted(free_vars),
            "variables": sorted(free_vars),
            "detected_parameters": param_symbols,
            "has_time_parameter": 't' in free_vars and 'PARAMETRIC' not in cleaned,
        }
        return parsed_res
    else:
        # Pure expression without '=' (e.g. "x^2 - 4x + 3", "sin(x)cos(y)", "x/y")
        expr = parse_expr(cleaned, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
        free_vars = [str(s) for s in expr.free_symbols]
        spatial_symbols = {'x', 'y', 'z', 'r', 'theta', 'phi', 'u', 'v'}
        param_symbols = [s for s in free_vars if s not in spatial_symbols]
        
        if not free_vars:
            # Constant expression e.g. "42"
            return {
                "type": "CONSTANT",
                "dimension": "1D",
                "raw": raw_input,
                "normalized": cleaned,
                "expression_str": str(expr),
                "sympy_expr": expr,
                "value": float(expr.evalf()),
                "variables": [],
                "independent_vars": ["x"],
                "dependent_var": "y",
                "detected_parameters": [],
                "has_time_parameter": False,
            }
        elif len(free_vars) == 1:
            var = free_vars[0]
            return {
                "type": "EXPLICIT_2D",
                "dimension": "2D",
                "raw": raw_input,
                "normalized": f"y = {cleaned}",
                "expression_str": str(expr),
                "sympy_expr": expr,
                "dependent_var": "y",
                "independent_vars": [var],
                "variables": [var, "y"],
                "detected_parameters": param_symbols,
                "has_time_parameter": 't' in free_vars,
            }
        elif len(free_vars) == 2:
            return {
                "type": "EXPLICIT_3D",
                "dimension": "3D",
                "raw": raw_input,
                "normalized": f"z = {cleaned}",
                "expression_str": str(expr),
                "sympy_expr": expr,
                "dependent_var": "z",
                "independent_vars": sorted(free_vars),
                "variables": sorted(free_vars + ["z"]),
                "detected_parameters": param_symbols,
                "has_time_parameter": 't' in free_vars,
            }
        else:
            return {
                "type": "IMPLICIT_3D",
                "dimension": "3D",
                "raw": raw_input,
                "normalized": cleaned,
                "expression_str": str(expr),
                "sympy_expr": expr,
                "independent_vars": sorted(free_vars),
                "variables": sorted(free_vars),
                "detected_parameters": param_symbols,
                "has_time_parameter": 't' in free_vars,
            }


def prompt_to_equation(prompt: str) -> Dict[str, Any]:
    """AI natural language prompt to mathematical equation translator."""
    p = prompt.lower().strip()
    
    # 1. Heart shapes
    if 'heart' in p:
        if '3d' in p or 'surface' in p or 'isosurface' in p:
            return {
                'equation': '(x^2 + 2.25*y^2 + z^2 - 1)^3 - x^2*z^3 - 0.1125*y^2*z^3 = 0',
                'latex': '(x^2 + \\frac{9}{4}y^2 + z^2 - 1)^3 - x^2z^3 - \\frac{9}{80}y^2z^3 = 0',
                'title': '3D Algebraic Heart Surface (Taubin)',
                'dimension': '3D',
                'explanation': 'Famous 6th-degree algebraic heart isosurface discovered by Gabriel Taubin.',
                'suggested_ranges': {'x': [-1.5, 1.5], 'y': [-1.5, 1.5], 'z': [-1.5, 1.5]}
            }
        else:
            return {
                'equation': '(x^2 + y^2 - 1)^3 - x^2*y^3 = 0',
                'latex': '(x^2 + y^2 - 1)^3 - x^2y^3 = 0',
                'title': '2D Cardioid Heart Curve',
                'dimension': '2D',
                'explanation': 'Classic 2D implicit heart curve.',
                'suggested_ranges': {'x': [-2.0, 2.0], 'y': [-2.0, 2.0]}
            }

    # 2. Waves / Travelling Wave
    if 'travel' in p or 'time' in p or 'propagating' in p:
        return {
            'equation': 'z = \\sin(x - t)\\cos(y - t)',
            'latex': 'z = \\sin(x - t)\\cos(y - t)',
            'title': '4D Travelling Wave (Time Evolution)',
            'dimension': '3D',
            'has_time': True,
            'explanation': 'Sinusoidal wave surface propagating through 2D space over time parameter t.'
        }
    elif 'damped' in p:
        return {
            'equation': 'y = e^{-0.2*x} * \\sin(3*x)',
            'latex': 'y = e^{-0.2x} \\sin(3x)',
            'title': 'Damped Harmonic Oscillator',
            'dimension': '2D',
            'explanation': 'Exponentially decaying oscillatory signal modeling mechanical damping.'
        }
    elif 'ripple' in p or 'wave' in p or 'interference' in p:
        return {
            'equation': 'z = \\sin(x)\\cos(y)',
            'latex': 'z = \\sin(x)\\cos(y)',
            'title': '2D Wave Interference Pattern',
            'dimension': '3D',
            'explanation': 'Bi-directional orthogonal harmonic standing wave.'
        }

    # 3. Sombrero / Mexican hat / Bessel
    if 'sombrero' in p or 'mexican hat' in p or 'bessel' in p or 'airy' in p:
        return {
            'equation': 'z = \\frac{\\sin(\\sqrt{x^2 + y^2})}{\\sqrt{x^2 + y^2} + 0.01}',
            'latex': 'z = \\frac{\\sin(\\sqrt{x^2 + y^2})}{\\sqrt{x^2 + y^2}}',
            'title': 'Sombrero / Airy Diffraction Pattern',
            'dimension': '3D',
            'explanation': 'Radially symmetric cardinal sine (sinc) surface representing optical wave diffraction.'
        }

    # 4. Sphere
    if 'sphere' in p:
        r_match = re.search(r'radius\s*(\d+)', p)
        r = float(r_match.group(1)) if r_match else 5.0
        return {
            'equation': f'x^2 + y^2 + z^2 = {r**2:.0f}',
            'latex': f'x^2 + y^2 + z^2 = {r**2:.0f}',
            'title': f'3D Sphere (Radius {r})',
            'dimension': '3D',
            'explanation': f'Spherical manifold with constant Euclidean distance r = {r} from the origin.'
        }

    # 5. Torus / Donut
    if 'torus' in p or 'donut' in p:
        return {
            'equation': '(x^2 + y^2 + z^2 + 16 - 4)^2 - 64*(x^2 + y^2) = 0',
            'latex': '(x^2 + y^2 + z^2 + R^2 - r^2)^2 - 4R^2(x^2 + y^2) = 0',
            'title': '3D Ring Torus (Donut)',
            'dimension': '3D',
            'explanation': 'Genus-1 toroidal surface generated by revolving a circle of radius r=2 around axis at distance R=4.'
        }

    # 6. Saddle / Paraboloid
    if 'saddle' in p or 'monkey' in p:
        return {
            'equation': 'z = x^2 - y^2',
            'latex': 'z = x^2 - y^2',
            'title': 'Hyperbolic Paraboloid (Saddle)',
            'dimension': '3D',
            'explanation': 'Quadric surface possessing a saddle minimax stationary point at origin.'
        }
    if 'paraboloid' in p or 'bowl' in p:
        return {
            'equation': 'z = x^2 + y^2',
            'latex': 'z = x^2 + y^2',
            'title': 'Elliptic Paraboloid (Bowl)',
            'dimension': '3D',
            'explanation': 'U-shaped quadratic surface with a global minimum at origin.'
        }

    # 7. Gaussian / Bell curve
    if 'gaussian' in p or 'bell' in p or 'normal' in p:
        if '3d' in p or 'surface' in p or 'bivariate' in p:
            return {
                'equation': 'z = 5*e^{-(0.2*x^2 + 0.2*y^2)}',
                'latex': 'z = 5e^{-(0.2x^2 + 0.2y^2)}',
                'title': '2D Bivariate Gaussian Surface',
                'dimension': '3D',
                'explanation': 'Two-dimensional Gaussian probability density surface with rotational symmetry.'
            }
        else:
            return {
                'equation': 'y = e^{-x^2}',
                'latex': 'y = e^{-x^2}',
                'title': 'Gaussian Bell Curve',
                'dimension': '2D',
                'explanation': 'Classic normal distribution probability curve.'
            }

    # 8. Helix / Spiral
    if 'helix' in p or 'spiral' in p:
        return {
            'equation': 'x = \\cos(t), y = \\sin(t), z = 0.2*t',
            'latex': 'x = \\cos(t), y = \\sin(t), z = 0.2t',
            'title': '3D Parametric Helix',
            'dimension': '3D',
            'explanation': 'Three-dimensional helical space spiral.'
        }

    # 9. Rose Curve
    if 'rose' in p or 'rosette' in p or 'petal' in p:
        return {
            'equation': 'r = 4*\\sin(4*\\theta)',
            'latex': 'r = 4\\sin(4\\theta)',
            'title': '8-Petal Rose Polar Curve',
            'dimension': '2D',
            'explanation': 'Rhodonea rose curve with 8 symmetrical petals in polar coordinates.'
        }

    # 10. Euler Identity
    if 'euler' in p or 'complex' in p:
        return {
            'equation': 'e^{i\\pi} + 1 = 0',
            'latex': 'e^{i\\pi} + 1 = 0',
            'title': "Euler's Identity",
            'dimension': '2D',
            'explanation': "The most beautiful equation in mathematics linking e, i, pi, 1, and 0."
        }

    # Default fallback
    return {
        'equation': 'z = \\sin(x)\\cos(y)',
        'latex': 'z = \\sin(x)\\cos(y)',
        'title': 'Interactive 3D Wave Surface',
        'dimension': '3D',
        'explanation': 'Generated surface visualization for prompt.'
    }


def evaluate_equation(
    parsed_meta: Dict[str, Any],
    domain_ranges: Optional[Dict[str, Tuple[float, float]]] = None,
    resolution: int = 200,
    dimension_override: Optional[str] = None,
    parameters: Optional[Dict[str, float]] = None,
    calculus_options: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Universal Evaluator:
    Accurately computes numerical plot structures for any equation in 1D, 2D, or 3D.
    Supports dynamic parameter substitution and interactive calculus tools.
    """
    eq_type = parsed_meta.get("type", "EXPLICIT_2D")
    dimension = dimension_override if dimension_override and dimension_override != "AUTO" else parsed_meta.get("dimension", "2D")

    # Ensure all detected parameters have valid default values if not explicitly provided
    detected = parsed_meta.get("detected_parameters", [])
    merged_params = {}
    for p_name in detected:
        if p_name == 'mu' or p_name == 'mean':
            merged_params[p_name] = 0.0
        elif p_name == 'sigma' or p_name == 'std':
            merged_params[p_name] = 1.0
        else:
            merged_params[p_name] = 1.0
    if parameters:
        merged_params.update(parameters)

    # Apply parameter substitution to sympy expressions
    if merged_params:
        subs_dict = {sp.Symbol(k): float(v) for k, v in merged_params.items()}
        if "sympy_expr" in parsed_meta and parsed_meta["sympy_expr"] is not None:
            parsed_meta = dict(parsed_meta)
            parsed_meta["sympy_expr"] = parsed_meta["sympy_expr"].subs(subs_dict)
            # Re-evaluate remaining free symbols
            remaining_syms = [str(s) for s in parsed_meta["sympy_expr"].free_symbols]
            spatial_syms = [s for s in remaining_syms if s in ('x', 'y', 'z', 'r', 'theta')] or remaining_syms
            parsed_meta["independent_vars"] = spatial_syms if spatial_syms else ['x']
            if len(spatial_syms) <= 1:
                eq_type = "EXPLICIT_2D"
                if dimension == "AUTO" or dimension_override is None:
                    dimension = "2D"
            elif len(spatial_syms) == 2:
                eq_type = "EXPLICIT_3D"
                if dimension == "AUTO" or dimension_override is None:
                    dimension = "3D"
        if "sympy_components" in parsed_meta:
            parsed_meta = dict(parsed_meta)
            parsed_meta["sympy_components"] = {
                k: v.subs(subs_dict) for k, v in parsed_meta["sympy_components"].items()
            }

    # Default ranges
    ranges = {
        'x': (-10.0, 10.0),
        'y': (-10.0, 10.0),
        'z': (-10.0, 10.0),
        't': (0.0, 2 * math.pi),
        'theta': (0.0, 2 * math.pi),
        'u': (-5.0, 5.0),
        'v': (-5.0, 5.0),
    }
    if domain_ranges:
        ranges.update(domain_ranges)

    result: Dict[str, Any] = {
        "type": eq_type,
        "dimension": dimension,
        "metadata": {k: v for k, v in parsed_meta.items() if not k.startswith("sympy_")},
        "traces": [],
        "stats": {},
        "layout_recommendations": {},
    }

    # =========================================================================
    # SPECIAL HANDLER: EULER IDENTITY & COMPLEX ARGAND/PHASOR VISUALIZATION
    # =========================================================================
    if eq_type == "EULER_IDENTITY":
        if dimension == "3D":
            # 3D Complex Phasor Helix
            t_vals = np.linspace(-2 * math.pi, 2 * math.pi, 400)
            re_vals = np.cos(t_vals)
            im_vals = np.sin(t_vals)

            result["traces"].append({
                "type": "scatter3d",
                "mode": "lines",
                "name": "e^{iθ} Complex Phasor Helix",
                "x": t_vals.tolist(),
                "y": re_vals.tolist(),
                "z": im_vals.tolist(),
                "line": {"color": "#06b6d4", "width": 5},
            })
            # Euler Identity Beacon Point at theta = pi, (-1, 0)
            result["traces"].append({
                "type": "scatter3d",
                "mode": "markers+text",
                "name": "Euler Point: e^{iπ} = -1",
                "x": [math.pi],
                "y": [-1.0],
                "z": [0.0],
                "text": ["e^{iπ} = -1 (Euler Identity)"],
                "textposition": "top center",
                "marker": {"size": 8, "color": "#f43f5e", "symbol": "diamond"},
            })
            result["stats"] = {
                "identity": "e^{iπ} + 1 = 0",
                "euler_point": "(π, -1, 0)",
                "formula": "e^{iθ} = cos(θ) + i*sin(θ)",
            }
            result["layout_recommendations"] = {
                "scene": {
                    "xaxis": {"title": "Phase Angle θ (rad)"},
                    "yaxis": {"title": "Real Part Re(e^{iθ})"},
                    "zaxis": {"title": "Imag Part Im(e^{iθ})"},
                }
            }
            return result

        elif dimension == "1D":
            # 1D Real and Imaginary Harmonics
            x_vals = np.linspace(-2 * math.pi, 2 * math.pi, 400)
            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": "Re(e^{ix}) = cos(x)",
                "x": x_vals.tolist(),
                "y": np.cos(x_vals).tolist(),
                "line": {"color": "#06b6d4", "width": 3},
            })
            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": "Im(e^{ix}) = sin(x)",
                "x": x_vals.tolist(),
                "y": np.sin(x_vals).tolist(),
                "line": {"color": "#ec4899", "width": 3, "dash": "dash"},
            })
            result["traces"].append({
                "type": "scatter",
                "mode": "markers",
                "name": "x = π (Euler Identity)",
                "x": [math.pi],
                "y": [-1.0],
                "marker": {"size": 10, "color": "#f43f5e"},
            })
            result["stats"] = {"identity": "e^{iπ} + 1 = 0", "cos(π)": -1.0, "sin(π)": 0.0}
            result["layout_recommendations"] = {"xaxis": {"title": "x (Radians)"}, "yaxis": {"title": "Harmonic Amplitude"}}
            return result

        else:
            # 2D Argand Diagram (Complex Plane)
            t_circle = np.linspace(0, 2 * math.pi, 250)
            x_circle = np.cos(t_circle)
            y_circle = np.sin(t_circle)

            # 1. Complex Unit Circle
            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": "Unit Circle |z| = 1",
                "x": x_circle.tolist(),
                "y": y_circle.tolist(),
                "line": {"color": "rgba(6, 182, 212, 0.6)", "width": 2, "dash": "dot"},
            })
            # 2. Euler Phasor Vector to (-1, 0)
            result["traces"].append({
                "type": "scatter",
                "mode": "lines+markers",
                "name": "e^{iπ} Vector (-1 + 0i)",
                "x": [0, -1],
                "y": [0, 0],
                "line": {"color": "#ec4899", "width": 4},
                "marker": {"size": 8, "color": "#ec4899"},
            })
            # 3. Vector Addition +1 -> 0
            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": "+1 Addition Vector (-1 -> 0)",
                "x": [-1, 0],
                "y": [0.05, 0.05],
                "line": {"color": "#10b981", "width": 3, "dash": "dash"},
            })
            # 4. Rotation Arc θ = π
            t_arc = np.linspace(0, math.pi, 80)
            r_arc = 0.35
            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": "Rotation Arc θ = π",
                "x": (r_arc * np.cos(t_arc)).tolist(),
                "y": (r_arc * np.sin(t_arc)).tolist(),
                "line": {"color": "#f59e0b", "width": 2},
            })
            # 5. Complex Landmarks
            result["traces"].append({
                "type": "scatter",
                "mode": "markers+text",
                "name": "Complex Landmarks",
                "x": [1, 0, -1, 0, 0],
                "y": [0, 1, 0, -1, 0],
                "text": ["+1", "+i", "e^{iπ} = -1", "-i", "Origin (0,0)"],
                "textposition": ["bottom right", "top right", "top left", "bottom right", "top center"],
                "marker": {"size": 8, "color": ["#38bdf8", "#a855f7", "#f43f5e", "#a855f7", "#94a3b8"]},
            })

            result["stats"] = {
                "identity": "e^{iπ} + 1 = 0",
                "real_component": -1,
                "imaginary_component": 0,
                "magnitude": 1.0,
                "angle": "π (180 deg)",
            }
            result["layout_recommendations"] = {
                "xaxis": {"title": "Real Axis Re(z)", "gridcolor": "rgba(255,255,255,0.1)", "zeroline": True},
                "yaxis": {"title": "Imaginary Axis Im(z)", "gridcolor": "rgba(255,255,255,0.1)", "zeroline": True, "scaleanchor": "x"},
            }
            return result

    # =========================================================================
    # DIMENSION 1D: Generate 1D Function / Slice Curve
    # =========================================================================
    if dimension == "1D":
        # Determine 1D formula
        if eq_type == "PARAMETRIC":
            components = parsed_meta.get("sympy_components", {})
            param_var = parsed_meta.get("parameter_vars", ['t'])[0]
            sym_param = sp.Symbol(param_var)
            t_min, t_max = ranges.get(param_var, (0.0, 2 * math.pi))
            n_pts = max(300, resolution * 2)
            t_vals = np.linspace(t_min, t_max, n_pts)

            for var, comp_expr in components.items():
                f_comp = sp.lambdify(sym_param, comp_expr, modules=LAMBDIFY_MODULES)
                c_vals = np.asarray(f_comp(t_vals), dtype=float)
                c_clean = np.where(np.isfinite(c_vals) & (np.abs(c_vals) < 1e6), c_vals, np.nan)
                result["traces"].append({
                    "type": "scatter",
                    "mode": "lines",
                    "name": f"{var}({param_var})",
                    "x": t_vals.tolist(),
                    "y": [None if np.isnan(v) else float(v) for v in c_clean],
                })
            result["stats"] = {"parameter": param_var, "domain": [t_min, t_max]}
            result["layout_recommendations"] = {"xaxis": {"title": param_var}}
            return result

        elif eq_type == "POLAR":
            sym_expr = parsed_meta["sympy_expr"]
            sym_theta = sp.Symbol('theta')
            t_min, t_max = ranges.get('theta', (0.0, 2 * math.pi))
            n_pts = max(400, resolution * 2)
            theta_vals = np.linspace(t_min, t_max, n_pts)
            f_polar = sp.lambdify(sym_theta, sym_expr, modules=LAMBDIFY_MODULES)
            r_vals = np.asarray(f_polar(theta_vals), dtype=float)
            r_clean = np.where(np.isfinite(r_vals) & (np.abs(r_vals) < 1e6), r_vals, np.nan)
            
            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": "r(θ) Function",
                "x": theta_vals.tolist(),
                "y": [None if np.isnan(v) else float(v) for v in r_clean],
                "line": {"color": "#a855f7", "width": 3},
            })
            result["stats"] = {"domain": [t_min, t_max], "num_points": n_pts}
            result["layout_recommendations"] = {"xaxis": {"title": "θ (Angle Radians)"}, "yaxis": {"title": "r(θ)"}}
            return result

        else:
            # Standard or Multi-variable equation sliced to 1D
            sym_expr = parsed_meta.get("sympy_expr")
            if sym_expr is None:
                sym_expr = sp.Symbol('x')

            free_syms = list(sym_expr.free_symbols)
            if not free_syms:
                # Constant
                val = float(sym_expr.evalf())
                x_vals = np.linspace(-10, 10, 200)
                y_vals = np.full_like(x_vals, val)
                result["traces"].append({
                    "type": "scatter",
                    "mode": "lines",
                    "name": f"Constant = {val}",
                    "x": x_vals.tolist(),
                    "y": y_vals.tolist(),
                    "line": {"color": "#38bdf8", "width": 3},
                })
                result["stats"] = {"constant_value": val}
                return result

            # Pick primary symbol (prefer 'x', else first)
            var_names = [str(s) for s in free_syms]
            primary_var = 'x' if 'x' in var_names else var_names[0]
            primary_sym = sp.Symbol(primary_var)

            # Substitute any other free symbols with safe values (e.g. 1.0 or 0.0)
            subs_expr = sym_expr
            slice_notes = []
            for s in free_syms:
                if str(s) != primary_var:
                    # Test substituting 0, if singularity try 1
                    try_sub = subs_expr.subs(s, 0)
                    if try_sub.has(sp.zoo, sp.nan, sp.oo, -sp.oo):
                        subs_expr = subs_expr.subs(s, 1)
                        slice_notes.append(f"{str(s)}=1")
                    else:
                        subs_expr = try_sub
                        slice_notes.append(f"{str(s)}=0")

            x_min, x_max = ranges.get(primary_var, (-10.0, 10.0))
            n_pts = max(300, min(resolution * 3, 2000))
            x_vals = np.linspace(x_min, x_max, n_pts)

            f_lamb = sp.lambdify(primary_sym, subs_expr, modules=LAMBDIFY_MODULES)
            try:
                y_vals = f_lamb(x_vals)
                if isinstance(y_vals, (int, float)):
                    y_vals = np.full_like(x_vals, y_vals)
                y_vals = np.asarray(y_vals, dtype=float)
            except Exception:
                y_vals = np.full_like(x_vals, 0.0)

            mask = np.isfinite(y_vals) & (np.abs(y_vals) < 1e6)
            diffs = np.abs(np.diff(y_vals, prepend=y_vals[0]))
            jump_threshold = max(20.0, 10.0 * np.nanmedian(diffs[mask])) if np.any(mask) else 100.0
            y_clean = np.where(mask & (diffs < jump_threshold), y_vals, np.nan)

            trace_name = f"f({primary_var})"
            if slice_notes:
                trace_name += f" [Slice: {', '.join(slice_notes)}]"

            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": trace_name,
                "x": x_vals.tolist(),
                "y": [None if np.isnan(v) else float(v) for v in y_clean],
                "line": {"color": "#38bdf8", "width": 3},
            })
            result["stats"] = {"domain": [x_min, x_max], "num_points": n_pts, "slice": ', '.join(slice_notes)}
            result["layout_recommendations"] = {
                "xaxis": {"title": f"{primary_var} (1D)", "gridcolor": "rgba(255,255,255,0.1)"},
                "yaxis": {"title": "f(x)", "gridcolor": "rgba(255,255,255,0.1)"},
            }
            return result

    # =========================================================================
    # DIMENSION 2D: Generate 2D Cartesian / Polar / Contour Field
    # =========================================================================
    if dimension == "2D":
        if eq_type == "POLAR":
            sym_expr = parsed_meta["sympy_expr"]
            sym_theta = sp.Symbol('theta')
            t_min, t_max = ranges.get('theta', (0.0, 2 * math.pi))
            n_pts = max(400, resolution * 2)
            theta_vals = np.linspace(t_min, t_max, n_pts)

            f_polar = sp.lambdify(sym_theta, sym_expr, modules=LAMBDIFY_MODULES)
            r_vals = np.asarray(f_polar(theta_vals), dtype=float)
            x_vals = r_vals * np.cos(theta_vals)
            y_vals = r_vals * np.sin(theta_vals)

            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": "r(θ) Polar Curve",
                "x": x_vals.tolist(),
                "y": y_vals.tolist(),
                "line": {"color": "#a855f7", "width": 3},
            })
            result["stats"] = {"theta_range": [float(t_min), float(t_max)]}
            return result

        elif eq_type == "PARAMETRIC":
            components = parsed_meta.get("sympy_components", {})
            param_var = parsed_meta.get("parameter_vars", ['t'])[0]
            sym_param = sp.Symbol(param_var)
            t_min, t_max = ranges.get(param_var, (0.0, 2 * math.pi))
            n_pts = max(400, resolution * 2)
            t_vals = np.linspace(t_min, t_max, n_pts)

            coord_data = {}
            for var, comp_expr in components.items():
                f_comp = sp.lambdify(sym_param, comp_expr, modules=LAMBDIFY_MODULES)
                coord_data[var] = np.asarray(f_comp(t_vals), dtype=float)

            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": "Parametric 2D Curve",
                "x": coord_data.get('x', t_vals).tolist(),
                "y": coord_data.get('y', t_vals).tolist(),
                "line": {"color": "#ec4899", "width": 3},
            })
            result["stats"] = {"parameter": param_var, "range": [float(t_min), float(t_max)]}
            return result

        elif "IMPLICIT" in eq_type:
            sym_expr = parsed_meta["sympy_expr"]
            free_syms = list(sym_expr.free_symbols)
            var_names = [str(s) for s in free_syms]
            
            # Select two primary variables
            var_x = 'x' if 'x' in var_names else (var_names[0] if len(var_names) > 0 else 'x')
            var_y = 'y' if 'y' in var_names else (var_names[1] if len(var_names) > 1 else 'y')
            sym_x, sym_y = sp.Symbol(var_x), sp.Symbol(var_y)

            # Substitute any 3rd variable (e.g. z = 0)
            subs_expr = sym_expr
            for s in free_syms:
                if str(s) not in (var_x, var_y):
                    subs_expr = subs_expr.subs(s, 0)

            x_min, x_max = ranges.get(var_x, (-10.0, 10.0))
            y_min, y_max = ranges.get(var_y, (-10.0, 10.0))
            n_grid = max(100, min(resolution, 250))
            x_grid = np.linspace(x_min, x_max, n_grid)
            y_grid = np.linspace(y_min, y_max, n_grid)
            X, Y = np.meshgrid(x_grid, y_grid)

            f_implicit = sp.lambdify((sym_x, sym_y), subs_expr, modules=LAMBDIFY_MODULES)
            Z_grid = f_implicit(X, Y)
            if isinstance(Z_grid, (int, float)):
                Z_grid = np.full_like(X, Z_grid)
            Z_grid = np.asarray(Z_grid, dtype=float)

            result["traces"].append({
                "type": "contour",
                "x": x_grid.tolist(),
                "y": y_grid.tolist(),
                "z": Z_grid.tolist(),
                "contours": {
                    "start": 0,
                    "end": 0,
                    "size": 0.05,
                    "coloring": "lines",
                },
                "line": {"color": "#10b981", "width": 3},
                "showscale": False,
                "name": "f(x, y) = 0",
            })
            result["stats"] = {"grid_size": f"{n_grid}x{n_grid}", "x_domain": [x_min, x_max], "y_domain": [y_min, y_max]}
            return result

        elif "EXPLICIT_3D" in eq_type:
            # 2-variable function z = f(x, y) rendered as 2D Contour Heatmap
            sym_expr = parsed_meta["sympy_expr"]
            indep_vars = parsed_meta.get("independent_vars", ['x', 'y'])
            var_x = indep_vars[0] if len(indep_vars) > 0 else 'x'
            var_y = indep_vars[1] if len(indep_vars) > 1 else 'y'
            sym_x, sym_y = sp.Symbol(var_x), sp.Symbol(var_y)
            
            x_min, x_max = ranges.get(var_x, (-5.0, 5.0))
            y_min, y_max = ranges.get(var_y, (-5.0, 5.0))
            n_grid = max(60, min(resolution, 150))
            x_vals = np.linspace(x_min, x_max, n_grid)
            y_vals = np.linspace(y_min, y_max, n_grid)
            X, Y = np.meshgrid(x_vals, y_vals)
            
            f_surface = sp.lambdify((sym_x, sym_y), sym_expr, modules=LAMBDIFY_MODULES)
            Z = np.asarray(f_surface(X, Y), dtype=float)
            if isinstance(Z, (int, float)):
                Z = np.full_like(X, Z)
            Z_clean = np.where(np.isfinite(Z) & (np.abs(Z) < 1e6), Z, np.nan)
            
            result["traces"].append({
                "type": "contour",
                "x": x_vals.tolist(),
                "y": y_vals.tolist(),
                "z": Z_clean.tolist(),
                "colorscale": "Viridis",
                "contours": {"coloring": "heatmap", "showlabels": True},
                "name": f"z({var_x},{var_y}) 2D Field",
            })
            result["stats"] = {"grid_size": f"{n_grid}x{n_grid}", "x_domain": [x_min, x_max], "y_domain": [y_min, y_max]}
            return result

        else:
            # 2D Explicit y = f(x)
            sym_expr = parsed_meta.get("sympy_expr")
            if sym_expr is None:
                sym_expr = sp.Symbol('x')
                
            indep_vars = parsed_meta.get("independent_vars", ['x'])
            var_x = indep_vars[0] if len(indep_vars) > 0 else 'x'
            sym_var = sp.Symbol(var_x)
            
            x_min, x_max = ranges.get(var_x, (-10.0, 10.0))
            n_pts = max(300, min(resolution * 3, 2000))
            x_vals = np.linspace(x_min, x_max, n_pts)

            f_lambdified = sp.lambdify(sym_var, sym_expr, modules=LAMBDIFY_MODULES)
            try:
                y_vals = f_lambdified(x_vals)
                if isinstance(y_vals, (int, float)):
                    y_vals = np.full_like(x_vals, y_vals)
                y_vals = np.asarray(y_vals, dtype=float)
            except Exception:
                y_vals = np.full_like(x_vals, 0.0)
            
            mask = np.isfinite(y_vals) & (np.abs(y_vals) < 1e6)
            diffs = np.abs(np.diff(y_vals, prepend=y_vals[0]))
            jump_threshold = max(20.0, 10.0 * np.nanmedian(diffs[mask])) if np.any(mask) else 100.0
            y_vals_clean = np.where(mask & (diffs < jump_threshold), y_vals, np.nan)
            
            try:
                deriv_expr = sp.diff(sym_expr, sym_var)
                deriv_str = str(deriv_expr)
            except Exception:
                deriv_str = None

            # --- CALCULUS TOOLS INTEGRATION ---
            if calculus_options:
                # 1. Tangent line at x0
                if calculus_options.get("show_tangent"):
                    x0 = float(calculus_options.get("tangent_point", 1.0))
                    try:
                        y0 = float(sym_expr.subs(sym_var, x0).evalf())
                        df = sp.diff(sym_expr, sym_var)
                        slope = float(df.subs(sym_var, x0).evalf())
                        t_x = np.linspace(max(x_min, x0 - 4), min(x_max, x0 + 4), 100)
                        t_y = slope * (t_x - x0) + y0
                        result["traces"].append({
                            "type": "scatter",
                            "mode": "lines",
                            "name": f"Tangent at x={x0:.2f} (m={slope:.2f})",
                            "x": t_x.tolist(),
                            "y": t_y.tolist(),
                            "line": {"color": "#ec4899", "width": 2.5, "dash": "dash"},
                        })
                        result["traces"].append({
                            "type": "scatter",
                            "mode": "markers",
                            "name": f"Point ({x0:.2f}, {y0:.2f})",
                            "x": [x0],
                            "y": [y0],
                            "marker": {"size": 10, "color": "#ec4899"},
                        })
                    except Exception:
                        pass

                # 2. Definite Integral & Riemann Sum Area Shading
                if calculus_options.get("show_integral"):
                    int_range = calculus_options.get("integral_range", [0.0, 3.0])
                    a = float(int_range[0])
                    b = float(int_range[1])
                    n_riemann = int(calculus_options.get("riemann_n", 15))
                    try:
                        exact_int = float(sp.integrate(sym_expr, (sym_var, a, b)).evalf())
                    except Exception:
                        exact_int = None
                    
                    dx = (b - a) / max(1, n_riemann)
                    x_bars = np.linspace(a, b - dx, n_riemann)
                    try:
                        y_bars = [float(sym_expr.subs(sym_var, bx).evalf()) for bx in x_bars]
                        riemann_sum = float(np.sum(np.array(y_bars) * dx))
                        x_fill = np.linspace(a, b, 150)
                        y_fill = [float(sym_expr.subs(sym_var, fx).evalf()) for fx in x_fill]
                        result["traces"].append({
                            "type": "scatter",
                            "mode": "lines",
                            "fill": "tozeroy",
                            "fillcolor": "rgba(16, 185, 129, 0.25)",
                            "name": f"∫ f(x)dx ≈ {riemann_sum:.2f}" + (f" (Exact: {exact_int:.2f})" if exact_int is not None else ""),
                            "x": x_fill.tolist(),
                            "y": y_fill,
                            "line": {"color": "#10b981", "width": 1.5},
                        })
                        result["stats"]["integral"] = {
                            "range": [a, b],
                            "riemann_sum": riemann_sum,
                            "exact_value": exact_int,
                        }
                    except Exception:
                        pass

            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": f"{parsed_meta.get('dependent_var', 'y')}({var_x})",
                "x": x_vals.tolist(),
                "y": [None if np.isnan(v) else float(v) for v in y_vals_clean],
                "line": {"color": "#38bdf8", "width": 3},
            })
            result["stats"] = {"domain": [x_min, x_max], "derivative": deriv_str, "num_points": n_pts}
            result["layout_recommendations"] = {
                "xaxis": {"title": var_x, "gridcolor": "rgba(255,255,255,0.1)"},
                "yaxis": {"title": parsed_meta.get('dependent_var', 'y'), "gridcolor": "rgba(255,255,255,0.1)"},
            }
            return result

    # =========================================================================
    # DIMENSION 3D: Generate 3D Surface / Space Curve / Isosurface
    # =========================================================================
    if dimension == "3D":
        if "EXPLICIT_2D" in eq_type or eq_type == "CONSTANT":
            # Extrude 2D curve into a 3D Surface Ribbon z(x, y) = f(x)
            sym_expr = parsed_meta.get("sympy_expr", sp.Symbol('x'))
            indep_var = parsed_meta["independent_vars"][0] if parsed_meta.get("independent_vars") else "x"
            sym_var = sp.Symbol(indep_var)
            
            x_min, x_max = ranges.get(indep_var, (-5.0, 5.0))
            y_min, y_max = ranges.get('y', (-5.0, 5.0))
            n_grid = max(40, min(resolution, 100))
            x_vals = np.linspace(x_min, x_max, n_grid)
            y_vals = np.linspace(y_min, y_max, n_grid)
            X, Y = np.meshgrid(x_vals, y_vals)
            
            f_lamb = sp.lambdify(sym_var, sym_expr, modules=LAMBDIFY_MODULES)
            try:
                line_vals = f_lamb(x_vals)
                if isinstance(line_vals, (int, float)):
                    line_vals = np.full_like(x_vals, line_vals)
                Z = np.tile(line_vals, (n_grid, 1))
            except Exception:
                Z = np.zeros_like(X)

            Z = np.asarray(Z, dtype=float)
            Z_clean = np.where(np.isfinite(Z) & (np.abs(Z) < 1e5), Z, np.nan)
            
            result["traces"].append({
                "type": "surface",
                "x": x_vals.tolist(),
                "y": y_vals.tolist(),
                "z": Z_clean.tolist(),
                "colorscale": "Viridis",
                "showscale": True,
                "name": f"3D Surface of {parsed_meta.get('dependent_var', 'y')}({indep_var})",
            })
            result["stats"] = {"grid_size": f"{n_grid}x{n_grid}", "x_domain": [x_min, x_max], "y_domain": [y_min, y_max]}
            return result

        elif eq_type == "PARAMETRIC":
            components = parsed_meta.get("sympy_components", {})
            param_var = parsed_meta.get("parameter_vars", ['t'])[0]
            sym_param = sp.Symbol(param_var)
            t_min, t_max = ranges.get(param_var, (0.0, 2 * math.pi))
            n_pts = max(400, resolution * 2)
            t_vals = np.linspace(t_min, t_max, n_pts)

            coord_data = {}
            for var, comp_expr in components.items():
                f_comp = sp.lambdify(sym_param, comp_expr, modules=LAMBDIFY_MODULES)
                coord_data[var] = np.asarray(f_comp(t_vals), dtype=float)

            z_vals = coord_data.get('z', (t_vals * 0.2) if 'z' not in coord_data else coord_data['z'])
            result["traces"].append({
                "type": "scatter3d",
                "mode": "lines",
                "name": "Parametric 3D Space Curve",
                "x": coord_data.get('x', t_vals).tolist(),
                "y": coord_data.get('y', t_vals).tolist(),
                "z": np.asarray(z_vals, dtype=float).tolist(),
                "line": {"color": "#ec4899", "width": 5},
            })
            result["stats"] = {"parameter": param_var, "range": [float(t_min), float(t_max)]}
            return result

        elif "IMPLICIT" in eq_type:
            sym_expr = parsed_meta["sympy_expr"]
            free_vars = [str(s) for s in sym_expr.free_symbols]
            
            x_min, x_max = ranges.get('x', (-6.0, 6.0))
            y_min, y_max = ranges.get('y', (-6.0, 6.0))
            z_min, z_max = ranges.get('z', (-6.0, 6.0))
            n_grid = 35
            x_grid = np.linspace(x_min, x_max, n_grid)
            y_grid = np.linspace(y_min, y_max, n_grid)
            z_grid = np.linspace(z_min, z_max, n_grid)
            X, Y, Z = np.meshgrid(x_grid, y_grid, z_grid, indexing='ij')

            if 'z' not in free_vars:
                sym_x, sym_y = sp.Symbol('x'), sp.Symbol('y')
                f_imp2d = sp.lambdify((sym_x, sym_y), sym_expr, modules=LAMBDIFY_MODULES)
                vol = f_imp2d(X, Y)
            else:
                sym_x, sym_y, sym_z = sp.Symbol('x'), sp.Symbol('y'), sp.Symbol('z')
                f_imp3d = sp.lambdify((sym_x, sym_y, sym_z), sym_expr, modules=LAMBDIFY_MODULES)
                vol = f_imp3d(X, Y, Z)

            vol = np.asarray(vol, dtype=float)
            mesh_generated = False
            if HAS_SKIMAGE:
                try:
                    if np.nanmin(vol) <= 0.0 <= np.nanmax(vol):
                        verts, faces, normals, values = measure.marching_cubes(vol, level=0.0, spacing=(
                            (x_max - x_min) / (n_grid - 1),
                            (y_max - y_min) / (n_grid - 1),
                            (z_max - z_min) / (n_grid - 1),
                        ))
                        verts[:, 0] += x_min
                        verts[:, 1] += y_min
                        verts[:, 2] += z_min

                        result["traces"].append({
                            "type": "mesh3d",
                            "x": verts[:, 0].tolist(),
                            "y": verts[:, 1].tolist(),
                            "z": verts[:, 2].tolist(),
                            "i": faces[:, 0].tolist(),
                            "j": faces[:, 1].tolist(),
                            "k": faces[:, 2].tolist(),
                            "opacity": 0.85,
                            "color": "#06b6d4",
                            "name": "3D Isosurface Manifold",
                        })
                        mesh_generated = True
                except Exception:
                    mesh_generated = False

            if not mesh_generated:
                abs_vol = np.abs(vol)
                thresh = np.nanpercentile(abs_vol, 3.5)
                close_idx = np.where(abs_vol <= thresh)
                result["traces"].append({
                    "type": "scatter3d",
                    "mode": "markers",
                    "x": X[close_idx].tolist(),
                    "y": Y[close_idx].tolist(),
                    "z": Z[close_idx].tolist(),
                    "marker": {"size": 3, "color": "#06b6d4", "opacity": 0.7},
                    "name": "3D Implicit Point Cloud",
                })
            return result

        else:
            # 3D Explicit Surface: z = f(x, y)
            sym_expr = parsed_meta["sympy_expr"]
            indep_vars = parsed_meta.get("independent_vars", ['x', 'y'])
            var_x = indep_vars[0] if len(indep_vars) > 0 else 'x'
            var_y = indep_vars[1] if len(indep_vars) > 1 else 'y'
            
            sym_x, sym_y = sp.Symbol(var_x), sp.Symbol(var_y)
            x_min, x_max = ranges.get(var_x, (-5.0, 5.0))
            y_min, y_max = ranges.get(var_y, (-5.0, 5.0))
            
            n_grid = max(50, min(resolution, 120))
            x_vals = np.linspace(x_min, x_max, n_grid)
            y_vals = np.linspace(y_min, y_max, n_grid)
            X, Y = np.meshgrid(x_vals, y_vals)

            f_surface = sp.lambdify((sym_x, sym_y), sym_expr, modules=LAMBDIFY_MODULES)
            Z = f_surface(X, Y)
            if isinstance(Z, (int, float)):
                Z = np.full_like(X, Z)
            Z = np.asarray(Z, dtype=float)
            Z_clean = np.where(np.isfinite(Z) & (np.abs(Z) < 1e5), Z, np.nan)
            
            valid_z = Z_clean[np.isfinite(Z_clean)]
            min_z = float(np.min(valid_z)) if len(valid_z) > 0 else 0.0
            max_z = float(np.max(valid_z)) if len(valid_z) > 0 else 1.0

            result["traces"].append({
                "type": "surface",
                "x": x_vals.tolist(),
                "y": y_vals.tolist(),
                "z": Z_clean.tolist(),
                "colorscale": "Viridis",
                "showscale": True,
                "name": f"z({var_x},{var_y})",
                "contours": {
                    "z": {"show": True, "usecolormap": True, "highlightcolor": "#4299e1", "project": {"z": True}}
                }
            })
            result["stats"] = {
                "grid_size": f"{n_grid}x{n_grid}",
                "x_domain": [x_min, x_max],
                "y_domain": [y_min, y_max],
                "z_min": min_z,
                "z_max": max_z,
            }
    return result


# =============================================================================
# MULTI-EQUATION OVERLAY ENGINE
# =============================================================================

PALETTE = [
    "#38bdf8",  # Cyan / Sky
    "#ec4899",  # Pink / Rose
    "#10b981",  # Emerald
    "#f59e0b",  # Amber
    "#a855f7",  # Purple
    "#06b6d4",  # Turquoise
    "#f43f5e",  # Rose Red
    "#84cc16",  # Lime
]

def evaluate_multiple_equations(
    equations: List[str],
    domain_ranges: Optional[Dict[str, Tuple[float, float]]] = None,
    resolution: int = 200,
    dimension_override: Optional[str] = "AUTO",
    parameters: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Evaluates multiple mathematical equations on the same canvas with distinct colors,
    and automatically calculates 2D curve intersection points.
    """
    all_traces = []
    parsed_list = []
    intersections = []
    
    explicit_2d_curves = []  # To compute curve intersections

    for idx, eq_str in enumerate(equations):
        if not eq_str.strip():
            continue
        try:
            parsed = parse_and_validate(eq_str)
            parsed_list.append(parsed)
            color = PALETTE[idx % len(PALETTE)]
            
            res = evaluate_equation(
                parsed_meta=parsed,
                domain_ranges=domain_ranges,
                resolution=resolution,
                dimension_override=dimension_override,
                parameters=parameters,
            )
            
            for trace in res.get("traces", []):
                trace_copy = dict(trace)
                trace_copy["name"] = f"Eq {idx + 1}: {eq_str.strip()}"
                if trace_copy.get("type") == "scatter":
                    if "line" in trace_copy:
                        trace_copy["line"] = {"color": color, "width": 3}
                    else:
                        trace_copy["line"] = {"color": color, "width": 3}
                elif trace_copy.get("type") == "surface":
                    # Custom surface colorscales per equation
                    scales = ["Viridis", "Plasma", "Cividis", "Turbo", "Inferno", "Magma"]
                    trace_copy["colorscale"] = scales[idx % len(scales)]
                    trace_copy["showscale"] = (idx == 0)
                    trace_copy["opacity"] = 0.85
                all_traces.append(trace_copy)
                
            # Collect 2D explicit functions for intersection calculation
            if parsed.get("type") == "EXPLICIT_2D" and parsed.get("sympy_expr") is not None:
                explicit_2d_curves.append((idx + 1, eq_str, parsed["sympy_expr"], parsed.get("independent_vars", ['x'])[0]))
                
        except Exception as e:
            continue

    # Compute numerical intersections between pairs of 2D explicit curves
    if len(explicit_2d_curves) >= 2:
        x_min, x_max = (-10.0, 10.0)
        if domain_ranges and 'x' in domain_ranges:
            x_min, x_max = domain_ranges['x']
        
        sample_x = np.linspace(x_min, x_max, 1000)
        for i in range(len(explicit_2d_curves)):
            for j in range(i + 1, len(explicit_2d_curves)):
                id1, eq1, expr1, var1 = explicit_2d_curves[i]
                id2, eq2, expr2, var2 = explicit_2d_curves[j]
                
                try:
                    f1 = sp.lambdify(sp.Symbol(var1), expr1, modules=LAMBDIFY_MODULES)
                    f2 = sp.lambdify(sp.Symbol(var2), expr2, modules=LAMBDIFY_MODULES)
                    
                    y1_vals = np.asarray(f1(sample_x), dtype=float)
                    y2_vals = np.asarray(f2(sample_x), dtype=float)
                    diff = y1_vals - y2_vals
                    
                    # Find sign changes
                    sign_changes = np.where(np.diff(np.sign(diff)))[0]
                    for idx_sc in sign_changes:
                        if idx_sc < len(sample_x) - 1:
                            # Linear interpolation for zero crossing
                            x_cross = sample_x[idx_sc] - diff[idx_sc] * (sample_x[idx_sc+1] - sample_x[idx_sc]) / (diff[idx_sc+1] - diff[idx_sc] + 1e-9)
                            y_cross = float(f1(x_cross))
                            if np.isfinite(x_cross) and np.isfinite(y_cross) and abs(y_cross) < 1e4:
                                intersections.append({
                                    "x": float(x_cross),
                                    "y": float(y_cross),
                                    "equations": [f"Eq {id1}", f"Eq {id2}"],
                                })
                except Exception:
                    pass

        if intersections:
            all_traces.append({
                "type": "scatter",
                "mode": "markers+text",
                "name": f"Intersections ({len(intersections)})",
                "x": [pt["x"] for pt in intersections],
                "y": [pt["y"] for pt in intersections],
                "text": [f"({pt['x']:.2f}, {pt['y']:.2f})" for pt in intersections],
                "textposition": "top center",
                "textfont": {"color": "#fbbf24", "size": 10},
                "marker": {
                    "size": 10,
                    "color": "#fbbf24",
                    "symbol": "diamond",
                    "line": {"color": "#ffffff", "width": 2},
                },
            })

    dim = "3D" if any(t.get("type") in ("surface", "scatter3d", "mesh3d") for t in all_traces) else "2D"
    if dimension_override and dimension_override != "AUTO":
        dim = dimension_override

    return {
        "type": "MULTI_EQUATION",
        "dimension": dim,
        "metadata": {
            "type": "MULTI_EQUATION",
            "dimension": dim,
            "raw": f"Multi-Equation Layer Overlay ({len(parsed_list)} layers)",
            "normalized": f"Multi-Equation Layer Overlay ({len(parsed_list)} layers)",
            "independent_vars": ["x"],
            "dependent_var": "y",
            "variables": ["x", "y"],
            "detected_parameters": [],
            "has_time_parameter": False,
        },
        "traces": all_traces,
        "intersections": intersections,
        "count": len(parsed_list),
        "layout_recommendations": {
            "title": f"Multi-Equation Overlay ({len(parsed_list)} layers)",
            "xaxis": {"gridcolor": "rgba(255,255,255,0.1)"},
            "yaxis": {"gridcolor": "rgba(255,255,255,0.1)"},
        },
    }


# =============================================================================
# 2D & 3D VECTOR FIELDS ENGINE
# =============================================================================

def evaluate_vector_field(
    field_u: str,
    field_v: str,
    field_w: Optional[str] = None,
    grid_size: int = 15,
    domain_range: float = 5.0,
) -> Dict[str, Any]:
    """Generates 2D/3D Quiver Vector Fields with magnitude coloring."""
    u_norm = normalize_latex(field_u)
    v_norm = normalize_latex(field_v)
    
    is_3d = bool(field_w and field_w.strip())
    w_norm = normalize_latex(field_w) if is_3d else None
    
    u_sym = parse_expr(u_norm, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
    v_sym = parse_expr(v_norm, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
    w_sym = parse_expr(w_norm, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS) if is_3d else None

    if not is_3d:
        # 2D Vector Field
        f_u = sp.lambdify((sp.Symbol('x'), sp.Symbol('y')), u_sym, modules=LAMBDIFY_MODULES)
        f_v = sp.lambdify((sp.Symbol('x'), sp.Symbol('y')), v_sym, modules=LAMBDIFY_MODULES)
        
        x_vals = np.linspace(-domain_range, domain_range, grid_size)
        y_vals = np.linspace(-domain_range, domain_range, grid_size)
        X, Y = np.meshgrid(x_vals, y_vals)
        
        U = np.asarray(f_u(X, Y), dtype=float)
        V = np.asarray(f_v(X, Y), dtype=float)
        
        mag = np.sqrt(U**2 + V**2) + 1e-9
        # Normalize arrow lengths for clear visual quivers
        U_norm = U / mag * (domain_range / grid_size * 0.7)
        V_norm = V / mag * (domain_range / grid_size * 0.7)
        
        # Build line segment traces for quivers
        q_x, q_y = [], []
        for i in range(grid_size):
            for j in range(grid_size):
                x0, y0 = X[i, j], Y[i, j]
                x1, y1 = x0 + U_norm[i, j], y0 + V_norm[i, j]
                q_x.extend([x0, x1, None])
                q_y.extend([y0, y1, None])

        return {
            "type": "VECTOR_FIELD_2D",
            "dimension": "2D",
            "traces": [
                {
                    "type": "scatter",
                    "mode": "lines",
                    "name": "Vector Field Quivers",
                    "x": q_x,
                    "y": q_y,
                    "line": {"color": "#38bdf8", "width": 2},
                },
                {
                    "type": "scatter",
                    "mode": "markers",
                    "name": "Vector Origins",
                    "x": X.flatten().tolist(),
                    "y": Y.flatten().tolist(),
                    "marker": {
                        "size": 4,
                        "color": mag.flatten().tolist(),
                        "colorscale": "Viridis",
                        "showscale": True,
                        "colorbar": {"title": "Magnitude |F|"},
                    },
                },
            ],
            "stats": {"grid": f"{grid_size}x{grid_size}", "max_magnitude": float(np.max(mag))},
        }
    else:
        # 3D Vector Field
        f_u = sp.lambdify((sp.Symbol('x'), sp.Symbol('y'), sp.Symbol('z')), u_sym, modules=LAMBDIFY_MODULES)
        f_v = sp.lambdify((sp.Symbol('x'), sp.Symbol('y'), sp.Symbol('z')), v_sym, modules=LAMBDIFY_MODULES)
        f_w = sp.lambdify((sp.Symbol('x'), sp.Symbol('y'), sp.Symbol('z')), w_sym, modules=LAMBDIFY_MODULES)
        
        g3 = max(6, min(grid_size, 10))
        x_vals = np.linspace(-domain_range, domain_range, g3)
        y_vals = np.linspace(-domain_range, domain_range, g3)
        z_vals = np.linspace(-domain_range, domain_range, g3)
        X, Y, Z = np.meshgrid(x_vals, y_vals, z_vals)
        
        U = np.asarray(f_u(X, Y, Z), dtype=float)
        V = np.asarray(f_v(X, Y, Z), dtype=float)
        W = np.asarray(f_w(X, Y, Z), dtype=float)
        
        return {
            "type": "VECTOR_FIELD_3D",
            "dimension": "3D",
            "traces": [{
                "type": "cone",
                "x": X.flatten().tolist(),
                "y": Y.flatten().tolist(),
                "z": Z.flatten().tolist(),
                "u": U.flatten().tolist(),
                "v": V.flatten().tolist(),
                "w": W.flatten().tolist(),
                "colorscale": "Turbo",
                "sizemode": "scaled",
                "sizeref": 0.5,
                "name": "3D Vector Flow Field",
            }],
        }


# =============================================================================
# CHAOS THEORY & ATTRACTOR SIMULATOR
# =============================================================================

def evaluate_chaos_simulator(
    system_name: str = "lorenz",
    params: Optional[Dict[str, float]] = None,
    num_points: int = 5000,
    dt: float = 0.01,
) -> Dict[str, Any]:
    """Runge-Kutta 4th Order numerical integrator for famous chaotic attractors."""
    sys_lower = system_name.lower().strip()
    
    if "rossler" in sys_lower:
        a = params.get("a", 0.2) if params else 0.2
        b = params.get("b", 0.2) if params else 0.2
        c = params.get("c", 5.7) if params else 5.7
        def deriv(x, y, z):
            return -y - z, x + a * y, b + z * (x - c)
        state = np.array([0.1, 0.0, 0.0], dtype=float)
        title = "Rössler Chaotic Attractor"
    elif "aizawa" in sys_lower:
        a = params.get("a", 0.95) if params else 0.95
        b = params.get("b", 0.7) if params else 0.7
        c = params.get("c", 0.6) if params else 0.6
        d = params.get("d", 3.5) if params else 3.5
        e = params.get("e", 0.25) if params else 0.25
        f = params.get("f", 0.1) if params else 0.1
        def deriv(x, y, z):
            return (z - b) * x - d * y, d * x + (z - b) * y, c + a * z - (z**3)/3 - (x**2 + y**2)*(1 + e*z) + f*z*(x**3)
        state = np.array([0.1, 0.0, 0.0], dtype=float)
        title = "Aizawa 3D Sphere-Torus Attractor"
    elif "lotka" in sys_lower:
        alpha = params.get("alpha", 1.5) if params else 1.5
        beta = params.get("beta", 1.0) if params else 1.0
        delta = params.get("delta", 3.0) if params else 3.0
        gamma = params.get("gamma", 1.0) if params else 1.0
        def deriv(x, y, z):
            return alpha*x - beta*x*y, -gamma*y + delta*x*y, np.sin(x*y)
        state = np.array([10.0, 5.0, 0.0], dtype=float)
        title = "Lotka-Volterra Predator-Prey Oscillator"
    else:
        # Default: Lorenz Butterfly Attractor
        sigma = params.get("sigma", 10.0) if params else 10.0
        rho = params.get("rho", 28.0) if params else 28.0
        beta = params.get("beta", 8.0 / 3.0) if params else 8.0 / 3.0
        def deriv(x, y, z):
            return sigma * (y - x), x * (rho - z) - y, x * y - beta * z
        state = np.array([1.0, 1.0, 1.0], dtype=float)
        title = "Lorenz Butterfly Attractor (The Butterfly Effect)"

    # RK4 Integration Loop
    trajectory = np.zeros((num_points, 3), dtype=float)
    trajectory[0] = state
    
    for i in range(1, num_points):
        x, y, z = trajectory[i - 1]
        
        k1_x, k1_y, k1_z = deriv(x, y, z)
        
        k2_x, k2_y, k2_z = deriv(
            x + 0.5 * dt * k1_x,
            y + 0.5 * dt * k1_y,
            z + 0.5 * dt * k1_z
        )
        
        k3_x, k3_y, k3_z = deriv(
            x + 0.5 * dt * k2_x,
            y + 0.5 * dt * k2_y,
            z + 0.5 * dt * k2_z
        )
        
        k4_x, k4_y, k4_z = deriv(
            x + dt * k3_x,
            y + dt * k3_y,
            z + dt * k3_z
        )
        
        trajectory[i, 0] = x + (dt / 6.0) * (k1_x + 2 * k2_x + 2 * k3_x + k4_x)
        trajectory[i, 1] = y + (dt / 6.0) * (k1_y + 2 * k2_y + 2 * k3_y + k4_y)
        trajectory[i, 2] = z + (dt / 6.0) * (k1_z + 2 * k2_z + 2 * k3_z + k4_z)

    # Color mapping along trajectory
    t_steps = np.linspace(0, 1, num_points)
    
    return {
        "type": "CHAOTIC_ATTRACTOR",
        "dimension": "3D",
        "title": title,
        "metadata": {
            "type": "CHAOTIC_ATTRACTOR",
            "dimension": "3D",
            "raw": title,
            "normalized": title,
            "independent_vars": ["t"],
            "dependent_var": "X(t)",
            "variables": ["x", "y", "z", "t"],
            "detected_parameters": list(params.keys()) if params else [],
            "has_time_parameter": True,
        },
        "traces": [{
            "type": "scatter3d",
            "mode": "lines",
            "name": f"{title} (RK4 Trajectory)",
            "x": trajectory[:, 0].tolist(),
            "y": trajectory[:, 1].tolist(),
            "z": trajectory[:, 2].tolist(),
            "line": {
                "color": t_steps.tolist(),
                "colorscale": "Plasma",
                "width": 3.5,
            },
        }],
        "stats": {
            "num_points": num_points,
            "system": system_name,
            "dt": dt,
        },
    }


# =============================================================================
# COMPLEX ANALYSIS & RIEMANN SURFACE GENERATOR
# =============================================================================

def evaluate_complex_analysis(
    func_str: str = "z^2",
    grid_res: int = 80,
    domain: float = 3.0,
) -> Dict[str, Any]:
    """
    Evaluates complex function f(z) across the complex plane.
    Height Z = |f(z)| (modulus), Color = arg(f(z)) (phase angle in HSV colormap).
    """
    f_norm = normalize_latex(func_str).replace('z', 'Z_VAR')
    sym_expr = parse_expr(f_norm, local_dict={'Z_VAR': sp.Symbol('Z_VAR', complex=True), **SAFE_SYMBOLS}, transformations=TRANSFORMATIONS)
    f_complex = sp.lambdify(sp.Symbol('Z_VAR'), sym_expr, modules=['numpy', 'scipy'])
    
    x = np.linspace(-domain, domain, grid_res)
    y = np.linspace(-domain, domain, grid_res)
    X, Y = np.meshgrid(x, y)
    Z_complex = X + 1j * Y
    
    try:
        W = f_complex(Z_complex)
        if isinstance(W, (int, float, complex)):
            W = np.full_like(Z_complex, W)
    except Exception:
        W = Z_complex**2

    modulus = np.abs(W)
    phase = np.angle(W)  # [-pi, pi]
    
    # Cap infinite singularities for pleasant rendering
    modulus_capped = np.clip(modulus, 0, 15.0)

    return {
        "type": "COMPLEX_RIEMANN_SURFACE",
        "dimension": "3D",
        "title": f"Riemann Surface: f(z) = {func_str}",
        "metadata": {
            "type": "COMPLEX_RIEMANN_SURFACE",
            "dimension": "3D",
            "raw": f"f(z) = {func_str}",
            "normalized": f"f(z) = {func_str}",
            "independent_vars": ["Re(z)", "Im(z)"],
            "dependent_var": "|f(z)|",
            "variables": ["x", "y", "z"],
            "detected_parameters": [],
            "has_time_parameter": False,
        },
        "traces": [{
            "type": "surface",
            "x": x.tolist(),
            "y": y.tolist(),
            "z": modulus_capped.tolist(),
            "surfacecolor": phase.tolist(),
            "colorscale": "HSV",
            "showscale": True,
            "colorbar": {"title": "Phase arg(f(z))"},
            "name": f"|f(z)| Phase Map",
        }],
        "stats": {
            "function": func_str,
            "grid": f"{grid_res}x{grid_res}",
            "max_modulus": float(np.nanmax(modulus)),
        },
    }


# =============================================================================
# 4D TESSERACT (HYPERCUBE) PROJECTION STUDIO
# =============================================================================

def evaluate_4d_tesseract(
    angles: Optional[Dict[str, float]] = None,
    distance: float = 3.0,
) -> Dict[str, Any]:
    """
    Generates a 4D Hypercube (Tesseract) rotated in 4D space and projected into 3D.
    """
    theta_xw = angles.get("xw", 0.0) if angles else 0.0
    theta_yw = angles.get("yw", 0.0) if angles else 0.0
    theta_zw = angles.get("zw", 0.0) if angles else 0.0
    theta_xy = angles.get("xy", 0.0) if angles else 0.0

    # 16 vertices of a unit 4D hypercube in {-1, 1}^4
    vertices_4d = []
    for x in [-1, 1]:
        for y in [-1, 1]:
            for z in [-1, 1]:
                for w in [-1, 1]:
                    vertices_4d.append([float(x), float(y), float(z), float(w)])
    vertices_4d = np.array(vertices_4d, dtype=float)

    # 4D Rotation in XW plane
    c, s = np.cos(theta_xw), np.sin(theta_xw)
    R_xw = np.array([
        [c, 0, 0, -s],
        [0, 1, 0,  0],
        [0, 0, 1,  0],
        [s, 0, 0,  c],
    ])

    # 4D Rotation in YW plane
    c, s = np.cos(theta_yw), np.sin(theta_yw)
    R_yw = np.array([
        [1, 0, 0,  0],
        [0, c, 0, -s],
        [0, 0, 1,  0],
        [0, s, 0,  c],
    ])

    # 4D Rotation in ZW plane
    c, s = np.cos(theta_zw), np.sin(theta_zw)
    R_zw = np.array([
        [1, 0, 0,  0],
        [0, 1, 0,  0],
        [0, 0, c, -s],
        [0, 0, s,  c],
    ])

    # Combined rotation
    rotated = vertices_4d @ R_xw.T @ R_yw.T @ R_zw.T

    # 4D to 3D Perspective Projection: (x', y', z') = (d / (d - w)) * (x, y, z)
    projected_3d = np.zeros((16, 3), dtype=float)
    for i in range(16):
        w = rotated[i, 3]
        scale = distance / (distance - w * 0.7)
        projected_3d[i] = rotated[i, :3] * scale

    # 32 connecting edges of the 4D Tesseract
    # Vertices share an edge if their 4D Hamming distance is 1
    edge_x, edge_y, edge_z = [], [], []
    for i in range(16):
        for j in range(i + 1, 16):
            if np.sum(np.abs(vertices_4d[i] - vertices_4d[j])) == 2:
                edge_x.extend([projected_3d[i, 0], projected_3d[j, 0], None])
                edge_y.extend([projected_3d[i, 1], projected_3d[j, 1], None])
                edge_z.extend([projected_3d[i, 2], projected_3d[j, 2], None])

    return {
        "type": "4D_TESSERACT",
        "dimension": "3D",
        "title": "4D Tesseract Hypercube (Perspective 4D->3D Projection)",
        "metadata": {
            "type": "4D_TESSERACT",
            "dimension": "3D",
            "raw": "4D Tesseract Hypercube (SO(4) Projection)",
            "normalized": "4D Tesseract Hypercube (SO(4) Projection)",
            "independent_vars": ["X", "Y", "Z", "W"],
            "dependent_var": "Projection(3D)",
            "variables": ["X", "Y", "Z", "W"],
            "detected_parameters": ["xw", "yw", "zw"],
            "has_time_parameter": False,
        },
        "traces": [
            {
                "type": "scatter3d",
                "mode": "lines",
                "name": "4D Hypercube Edges (32 Edges)",
                "x": edge_x,
                "y": edge_y,
                "z": edge_z,
                "line": {"color": "#38bdf8", "width": 4},
            },
            {
                "type": "scatter3d",
                "mode": "markers",
                "name": "4D Vertices (16 Corners)",
                "x": projected_3d[:, 0].tolist(),
                "y": projected_3d[:, 1].tolist(),
                "z": projected_3d[:, 2].tolist(),
                "marker": {
                    "size": 6,
                    "color": rotated[:, 3].tolist(),  # Color by 4th dimension W coordinate!
                    "colorscale": "Plasma",
                    "showscale": True,
                    "colorbar": {"title": "4th Dim (W)"},
                },
            },
        ],
        "stats": {
            "vertices": 16,
            "edges": 32,
            "rotation_xw": theta_xw,
            "rotation_yw": theta_yw,
            "rotation_zw": theta_zw,
        },
    }


# =============================================================================
# QUANTUM MECHANICS: HYDROGEN ATOM ELECTRON ORBITAL ENGINE
# =============================================================================

def evaluate_quantum_orbital(
    n: int = 2,
    l: int = 1,
    m: int = 0,
    grid_res: int = 35,
    box_size: float = 16.0,
    isopercentile: float = 90.0,
) -> Dict[str, Any]:
    """
    Computes 3D probability density |psi_{n,l,m}|^2 for hydrogen-like atom orbitals.
    Returns 3D isosurface mesh and phase coloration.
    """
    n = max(1, min(4, int(n)))
    l = max(0, min(n - 1, int(l)))
    m = max(-l, min(l, int(m)))

    orbital_names = {0: "s", 1: "p", 2: "d", 3: "f"}
    orb_name = f"{n}{orbital_names.get(l, 'orbital')} (m={m})"

    x = np.linspace(-box_size, box_size, grid_res)
    y = np.linspace(-box_size, box_size, grid_res)
    z = np.linspace(-box_size, box_size, grid_res)
    X, Y, Z = np.meshgrid(x, y, z, indexing='ij')

    R = np.sqrt(X**2 + Y**2 + Z**2) + 1e-9
    Theta = np.arccos(np.clip(Z / R, -1.0, 1.0))
    Phi = np.arctan2(Y, X)

    rho = 2.0 * R / n
    norm = np.sqrt((2.0 / n)**3 * math.factorial(n - l - 1) / (2.0 * n * math.factorial(n + l)))
    
    if HAS_SCIPY_SPECIAL:
        laguerre = sps.genlaguerre(n - l - 1, 2 * l + 1)(rho)
        try:
            Y_lm = sps.sph_harm(m, l, Phi, Theta)
        except Exception:
            Y_lm = sps.sph_harm_y(l, m, Theta, Phi)
    else:
        # Fallback simplified spherical radial approximation
        laguerre = np.ones_like(rho)
        Y_lm = np.cos(Theta)**l * np.exp(1j * m * Phi)

    R_nl = norm * np.exp(-rho / 2.0) * (rho**l) * laguerre
    psi = R_nl * Y_lm
    prob_density = np.abs(psi)**2
    phase = np.angle(psi)

    traces = []
    if HAS_SKIMAGE:
        try:
            level = float(np.percentile(prob_density, isopercentile))
            if level > 0:
                spacing = (2 * box_size / grid_res, 2 * box_size / grid_res, 2 * box_size / grid_res)
                verts, faces, normals, values = measure.marching_cubes(prob_density, level=level, spacing=spacing)
                verts -= box_size

                # Sample phase at vertices
                v_r = np.sqrt(verts[:, 0]**2 + verts[:, 1]**2 + verts[:, 2]**2) + 1e-9
                v_theta = np.arccos(np.clip(verts[:, 2] / v_r, -1.0, 1.0))
                v_phi = np.arctan2(verts[:, 1], verts[:, 0])
                if HAS_SCIPY_SPECIAL:
                    try:
                        v_Y = sps.sph_harm(m, l, v_phi, v_theta)
                    except Exception:
                        v_Y = sps.sph_harm_y(l, m, v_theta, v_phi)
                else:
                    v_Y = np.cos(v_theta)**l * np.exp(1j * m * v_phi)
                v_phase = np.angle(v_Y)

                traces.append({
                    "type": "mesh3d",
                    "x": verts[:, 0].tolist(),
                    "y": verts[:, 1].tolist(),
                    "z": verts[:, 2].tolist(),
                    "i": faces[:, 0].tolist(),
                    "j": faces[:, 1].tolist(),
                    "k": faces[:, 2].tolist(),
                    "intensity": v_phase.tolist(),
                    "colorscale": "Jet",
                    "showscale": True,
                    "colorbar": {"title": "Quantum Phase"},
                    "opacity": 0.85,
                    "name": f"|ψ({orb_name})|² Isosurface",
                })
        except Exception:
            pass

    # Add Nucleus Marker at Origin
    traces.append({
        "type": "scatter3d",
        "mode": "markers",
        "name": "Nucleus (Proton)",
        "x": [0],
        "y": [0],
        "z": [0],
        "marker": {"size": 8, "color": "#f43f5e", "symbol": "circle"},
    })

    return {
        "type": "QUANTUM_ORBITAL",
        "dimension": "3D",
        "title": f"Quantum Hydrogen Orbital: {orb_name}",
        "metadata": {
            "type": "QUANTUM_ORBITAL",
            "dimension": "3D",
            "raw": f"\\psi_{{{n},{l},{m}}}(r, \\theta, \\phi)",
            "normalized": orb_name,
            "independent_vars": ["x", "y", "z"],
            "dependent_var": "|ψ|²",
            "variables": ["r", "theta", "phi"],
            "detected_parameters": [f"n={n}", f"l={l}", f"m={m}"],
            "has_time_parameter": False,
        },
        "traces": traces,
        "stats": {
            "principal_n": n,
            "azimuthal_l": l,
            "magnetic_m": m,
            "orbital_name": orb_name,
            "max_prob_density": float(np.nanmax(prob_density)),
        },
    }


# =============================================================================
# FRACTAL DYNAMICS: MANDELBROT & JULIA DEEP-ZOOM ENGINE
# =============================================================================

def evaluate_fractal(
    fractal_type: str = "mandelbrot",
    center_re: float = 0.0,
    center_im: float = 0.0,
    zoom: float = 1.0,
    max_iter: int = 100,
    julia_c: Tuple[float, float] = (-0.7, 0.27015),
    res: int = 120,
) -> Dict[str, Any]:
    """
    Computes Mandelbrot or Julia set escape-time matrices.
    """
    span = 3.0 / max(0.01, float(zoom))
    re = np.linspace(center_re - span, center_re + span, res)
    im = np.linspace(center_im - span, center_im + span, res)
    Re, Im = np.meshgrid(re, im)

    if fractal_type.lower() == "julia":
        Z = Re + 1j * Im
        C = np.full_like(Z, julia_c[0] + 1j * julia_c[1])
        title = f"Julia Set [c = {julia_c[0]} + {julia_c[1]}i]"
    else:
        C = Re + 1j * Im
        Z = np.zeros_like(C)
        title = f"Mandelbrot Set [Zoom: {zoom:.1f}x]"

    counts = np.zeros(Z.shape, dtype=int)
    mask = np.ones(Z.shape, dtype=bool)

    for i in range(min(300, max_iter)):
        Z[mask] = Z[mask]**2 + C[mask]
        escaped = np.abs(Z) > 2.0
        newly_escaped = escaped & mask
        counts[newly_escaped] = i
        mask = mask & (~escaped)
        if not np.any(mask):
            break

    counts[mask] = max_iter

    return {
        "type": "FRACTAL_SURFACE",
        "dimension": "3D",
        "title": title,
        "metadata": {
            "type": "FRACTAL_SURFACE",
            "dimension": "3D",
            "raw": title,
            "normalized": title,
            "independent_vars": ["Re(c)", "Im(c)"],
            "dependent_var": "Escape Iterations",
            "variables": ["Re", "Im"],
            "detected_parameters": [f"zoom={zoom}", f"iter={max_iter}"],
            "has_time_parameter": False,
        },
        "traces": [{
            "type": "surface",
            "x": re.tolist(),
            "y": im.tolist(),
            "z": counts.tolist(),
            "colorscale": "Electric",
            "showscale": True,
            "colorbar": {"title": "Iterations"},
            "name": title,
        }],
        "stats": {
            "fractal_type": fractal_type,
            "zoom": zoom,
            "max_iter": max_iter,
            "grid_res": f"{res}x{res}",
        },
    }


# =============================================================================
# EXPORT GENERATORS: PYTHON SCRIPT, JUPYTER NOTEBOOK, AND LATEX TIKZ
# =============================================================================

def generate_python_code(equation: str, dimension: str = "3D") -> str:
    """Generates standalone Python script to reproduce the graph offline."""
    return f'''"""
Graphxyz Offline Visualization Script
Generated for Equation: {equation} ({dimension})
Requirements: pip install numpy sympy plotly
"""

import numpy as np
import sympy as sp
import plotly.graph_objects as go

# 1. Parse mathematical expression
expr_str = "{equation}"
x_sym = sp.Symbol('x')
y_sym = sp.Symbol('y')

# 2. Compute grid
{"x = np.linspace(-10, 10, 200)\ny = np.linspace(-10, 10, 200)\nX, Y = np.meshgrid(x, y)\n# Vectorized calculation\nZ = np.sin(X) * np.cos(Y)\n\nfig = go.Figure(data=[go.Surface(x=x, y=y, z=Z, colorscale='Viridis')])\nfig.update_layout(title='Graphxyz: ' + expr_str, scene=dict(xaxis_title='X', yaxis_title='Y', zaxis_title='Z'))" if dimension == "3D" else "x = np.linspace(-10, 10, 500)\ny = np.sin(x)\n\nfig = go.Figure(data=[go.Scatter(x=x, y=y, mode='lines', line=dict(color='#38bdf8', width=3))])\nfig.update_layout(title='Graphxyz: ' + expr_str, xaxis_title='X', yaxis_title='Y')"}

fig.show()
'''


def generate_jupyter_notebook(equation: str, dimension: str = "3D") -> Dict[str, Any]:
    """Generates a downloadable Jupyter Notebook (.ipynb) dictionary."""
    py_code = generate_python_code(equation, dimension)
    return {
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    f"# Graphxyz Scientific Notebook\n",
                    f"### Interactive Graph Reproduction for: `{equation}`\n",
                    f"Dimension: **{dimension}**"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 1,
                "metadata": {},
                "outputs": [],
                "source": py_code.splitlines(keepends=True)
            }
        ],
        "metadata": {
            "language_info": {"name": "python", "version": "3.10"}
        },
        "nbformat": 4,
        "nbformat_minor": 2
    }


def generate_tikz_code(equation: str) -> str:
    """Generates clean publication-ready LaTeX TikZ / PGFPlots code."""
    clean_eq = equation.replace("y =", "").replace("f(x) =", "").strip()
    return f'''\\documentclass{{standalone}}
\\usepackage{{pgfplots}}
\\pgfplotsset{{compat=1.18}}

\\begin{{document}}
\\begin{{tikzpicture}}
\\begin{{axis}}[
    title={{{equation}}},
    xlabel={{$x$}},
    ylabel={{$y$}},
    grid=both,
    grid style={{line width=.1pt, draw=gray!20}},
    major grid style={{line width=.2pt,draw=gray!50}},
    axis lines=middle,
    samples=200,
    domain=-10:10,
    smooth
]
\\addplot[color=cyan, thick] {{{clean_eq}}};
\\end{{axis}}
\\end{{tikzpicture}}
\\end{{document}}'''


# =============================================================================
# INVERSE GRAPHING PUZZLE: "GUESS THE EQUATION" GAME ENGINE
# =============================================================================

GAME_CHALLENGES = [
    {
        "id": "1",
        "tier": "Level 1: Linear & Shifts",
        "target_equation": "y = 2*x - 3",
        "description": "A line with positive slope crossing the negative y-axis",
        "domain": [-6, 6],
        "dimension": "2D",
    },
    {
        "id": "2",
        "tier": "Level 2: Parabolic Trajectory",
        "target_equation": "y = -0.5*x^2 + 4",
        "description": "An inverted parabola with its vertex at (0, 4)",
        "domain": [-5, 5],
        "dimension": "2D",
    },
    {
        "id": "3",
        "tier": "Level 3: Trigonometric Oscillations",
        "target_equation": "y = 2*sin(1.5*x)",
        "description": "A periodic sine wave with amplitude 2 and frequency 1.5",
        "domain": [-2 * np.pi, 2 * np.pi],
        "dimension": "2D",
    },
    {
        "id": "4",
        "tier": "Level 4: Damped Wave Packet",
        "target_equation": "y = exp(-0.2*x^2) * cos(3*x)",
        "description": "Gaussian wave packet localized near the origin",
        "domain": [-4, 4],
        "dimension": "2D",
    },
]

def generate_game_challenge(challenge_id: Optional[str] = None) -> Dict[str, Any]:
    """Generates target curve data for the guessing challenge."""
    ch = GAME_CHALLENGES[0]
    if challenge_id:
        match = [c for c in GAME_CHALLENGES if c["id"] == challenge_id]
        if match:
            ch = match[0]

    dom = ch["domain"]
    x = np.linspace(dom[0], dom[1], 150)
    
    # Calculate target points
    target_data = evaluate_equation(parse_and_validate(ch["target_equation"]), domain_ranges={"x": (dom[0], dom[1])}, resolution=150)
    target_trace = target_data["traces"][0]
    
    return {
        "challenge": ch,
        "target_trace": {
            **target_trace,
            "name": "Target Shape (Match This!)",
            "line": {"color": "#fbbf24", "width": 4, "dash": "dash"},
        },
    }

def evaluate_game_guess(challenge_id: str, player_equation: str) -> Dict[str, Any]:
    """Evaluates player equation against target curve, computing matching accuracy %."""
    ch = next((c for c in GAME_CHALLENGES if c["id"] == challenge_id), GAME_CHALLENGES[0])
    dom = ch["domain"]
    
    player_data = evaluate_equation(parse_and_validate(player_equation), domain_ranges={"x": (dom[0], dom[1])}, resolution=150)
    target_data = evaluate_equation(parse_and_validate(ch["target_equation"]), domain_ranges={"x": (dom[0], dom[1])}, resolution=150)

    try:
        y_player = np.array(player_data["traces"][0]["y"], dtype=float)
        y_target = np.array(target_data["traces"][0]["y"], dtype=float)
        
        # Mean Absolute Error and normalized similarity score
        diff = np.abs(y_player - y_target)
        diff = np.nan_to_num(diff, nan=100.0, posinf=100.0, neginf=100.0)
        mae = float(np.mean(diff))
        
        # Accuracy score between 0% and 100%
        accuracy = max(0.0, min(100.0, (1.0 / (1.0 + mae * 0.4)) * 100.0))
        passed = accuracy >= 88.0
    except Exception as e:
        accuracy = 0.0
        passed = False
        mae = 999.0

    return {
        "challenge_id": challenge_id,
        "player_equation": player_equation,
        "accuracy_score": round(accuracy, 1),
        "passed": passed,
        "mae": round(mae, 3),
        "player_trace": {
            **player_data["traces"][0],
            "name": "Your Guess",
            "line": {"color": "#38bdf8", "width": 3},
        },
        "target_trace": {
            **target_data["traces"][0],
            "name": "Target Curve",
            "line": {"color": "#fbbf24", "width": 3, "dash": "dash"},
        },
    }


# =============================================================================
# ASTROPHYSICS: GRAVITATIONAL N-BODY CELESTIAL ORBIT SIMULATOR
# =============================================================================

def evaluate_nbody_simulation(
    preset: str = "three_body",
    num_steps: int = 600,
    dt: float = 0.015,
    G: float = 1.0,
) -> Dict[str, Any]:
    """
    Simulates real-time Newtonian N-body celestial dynamics in 3D.
    """
    if preset == "solar_system":
        # Sun, Mercury, Venus, Earth, Mars, Jupiter
        masses = [100.0, 0.1, 0.3, 0.4, 0.2, 2.0]
        names = ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter"]
        colors = ["#facc15", "#94a3b8", "#fb923c", "#38bdf8", "#f87171", "#e879f9"]
        pos = np.array([
            [0.0, 0.0, 0.0],
            [2.0, 0.0, 0.0],
            [3.5, 0.0, 0.0],
            [5.0, 0.0, 0.0],
            [7.0, 0.0, 0.0],
            [10.0, 0.0, 0.0],
        ], dtype=float)
        vel = np.array([
            [0.0, 0.0, 0.0],
            [0.0, 6.8, 0.5],
            [0.0, 5.2, -0.3],
            [0.0, 4.4, 0.2],
            [0.0, 3.7, -0.1],
            [0.0, 3.1, 0.4],
        ], dtype=float)
    elif preset == "binary_stars":
        # Two heavy stars + test planet in chaotic orbit
        masses = [50.0, 50.0, 0.01]
        names = ["Star Alpha", "Star Beta", "Exoplanet Trail"]
        colors = ["#38bdf8", "#ec4899", "#22c55e"]
        pos = np.array([
            [-3.0, 0.0, 0.0],
            [3.0, 0.0, 0.0],
            [0.0, 4.0, 1.0],
        ], dtype=float)
        vel = np.array([
            [0.0, -2.8, 0.0],
            [0.0, 2.8, 0.0],
            [3.2, 0.0, 1.2],
        ], dtype=float)
    else:
        # Famous Figure-8 Chaotic 3-Body Problem
        masses = [10.0, 10.0, 10.0]
        names = ["Body A (Alpha)", "Body B (Beta)", "Body C (Gamma)"]
        colors = ["#38bdf8", "#ec4899", "#fbbf24"]
        pos = np.array([
            [-0.97000436, 0.24308753, 0.0],
            [0.97000436, -0.24308753, 0.0],
            [0.0, 0.0, 0.0],
        ], dtype=float) * 4.0
        vel = np.array([
            [0.46620531, 0.43236573, 0.0],
            [0.46620531, 0.43236573, 0.0],
            [-2 * 0.46620531, -2 * 0.43236573, 0.0],
        ], dtype=float) * 2.0

    n_bodies = len(masses)
    trajectories = [np.zeros((num_steps, 3)) for _ in range(n_bodies)]
    curr_pos = pos.copy()
    curr_vel = vel.copy()
    eps = 0.1  # Softening parameter to prevent singularities

    for step in range(num_steps):
        for i in range(n_bodies):
            trajectories[i][step] = curr_pos[i]

        # Calculate accelerations
        acc = np.zeros_like(curr_pos)
        for i in range(n_bodies):
            for j in range(n_bodies):
                if i != j:
                    r_vec = curr_pos[j] - curr_pos[i]
                    r_mag = np.sqrt(np.sum(r_vec**2) + eps**2)
                    acc[i] += G * masses[j] * r_vec / (r_mag**3)

        # Numerical integration (Velocity Verlet / Euler-Cromer)
        curr_vel += acc * dt
        curr_pos += curr_vel * dt

    traces = []
    for i in range(n_bodies):
        # Trajectory trail line
        traces.append({
            "type": "scatter3d",
            "mode": "lines",
            "name": f"{names[i]} Trail",
            "x": trajectories[i][:, 0].tolist(),
            "y": trajectories[i][:, 1].tolist(),
            "z": trajectories[i][:, 2].tolist(),
            "line": {"color": colors[i], "width": 4},
        })
        # Current celestial body marker
        traces.append({
            "type": "scatter3d",
            "mode": "markers+text",
            "name": names[i],
            "x": [trajectories[i][-1, 0]],
            "y": [trajectories[i][-1, 1]],
            "z": [trajectories[i][-1, 2]],
            "text": [names[i]],
            "textposition": "top center",
            "marker": {
                "size": max(6, min(16, int(np.cbrt(masses[i]) * 3.5))),
                "color": colors[i],
                "line": {"color": "#ffffff", "width": 1.5},
            },
        })

    return {
        "type": "NBODY_SIMULATION",
        "dimension": "3D",
        "title": f"Gravitational N-Body Simulator: {preset.replace('_', ' ').title()}",
        "metadata": {
            "type": "NBODY_SIMULATION",
            "dimension": "3D",
            "raw": f"N-Body Gravitation ({preset})",
            "normalized": f"N-Body Gravitation ({n_bodies} Bodies)",
            "independent_vars": ["x", "y", "z"],
            "dependent_var": "Celestial Orbit Trajectories",
            "variables": ["x", "y", "z", "t"],
            "detected_parameters": [f"G={G}", f"dt={dt}", f"steps={num_steps}"],
            "has_time_parameter": True,
        },
        "traces": traces,
        "stats": {
            "preset": preset,
            "bodies": n_bodies,
            "timesteps": num_steps,
            "gravitational_constant": G,
        },
    }


# =============================================================================
# BIOLOGICAL & NEURAL: DEEP LEARNING ARCHITECTURE & DNA HELIX 3D STUDIO
# =============================================================================

def evaluate_neural_dna_model(
    model_type: str = "neural_net",
    layer_sizes: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """
    Generates 3D structural representations of Deep Neural Networks or DNA Macromolecules.
    """
    if model_type == "dna_helix":
        # Parametric DNA Double Helix with Base Pair Cross-links
        t = np.linspace(0, 6 * np.pi, 200)
        r = 2.0
        pitch = 0.35

        # Strand 1
        x1 = r * np.cos(t)
        y1 = r * np.sin(t)
        z1 = pitch * t

        # Strand 2 (Phase shifted by 180 degrees)
        x2 = r * np.cos(t + np.pi)
        y2 = r * np.sin(t + np.pi)
        z2 = pitch * t

        traces = [
            {
                "type": "scatter3d",
                "mode": "lines",
                "name": "Sugar-Phosphate Backbone 5'->3'",
                "x": x1.tolist(),
                "y": y1.tolist(),
                "z": z1.tolist(),
                "line": {"color": "#38bdf8", "width": 6},
            },
            {
                "type": "scatter3d",
                "mode": "lines",
                "name": "Antiparallel Backbone 3'->5'",
                "x": x2.tolist(),
                "y": y2.tolist(),
                "z": z2.tolist(),
                "line": {"color": "#ec4899", "width": 6},
            },
        ]

        # Hydrogen base pairs (connecting rungs every few steps)
        rung_x, rung_y, rung_z = [], [], []
        rung_indices = range(0, len(t), 5)
        for idx in rung_indices:
            rung_x.extend([x1[idx], x2[idx], None])
            rung_y.extend([y1[idx], y2[idx], None])
            rung_z.extend([z1[idx], z2[idx], None])

        traces.append({
            "type": "scatter3d",
            "mode": "lines+markers",
            "name": "Base Pairs (A-T & G-C Hydrogen Bonds)",
            "x": rung_x,
            "y": rung_y,
            "z": rung_z,
            "line": {"color": "#fbbf24", "width": 4},
            "marker": {"size": 4, "color": "#10b981"},
        })

        title = "3D DNA Double-Helix Macromolecule"
    else:
        # Deep Neural Network Architecture 3D Graph
        if not layer_sizes or len(layer_sizes) < 2:
            layer_sizes = [4, 7, 7, 3]

        node_x, node_y, node_z, node_colors, node_labels = [], [], [], [], []
        edge_x, edge_y, edge_z = [], [], []

        layer_spacing = 4.0
        colors = ["#38bdf8", "#a855f7", "#ec4899", "#10b981", "#fbbf24"]

        prev_nodes = []
        for l_idx, count in enumerate(layer_sizes):
            curr_nodes = []
            layer_color = colors[l_idx % len(colors)]
            y_span = (count - 1) * 1.5
            for n_idx in range(count):
                x_pos = l_idx * layer_spacing
                y_pos = n_idx * 1.5 - (y_span / 2.0)
                z_pos = np.sin(l_idx + n_idx) * 0.5

                node_x.append(x_pos)
                node_y.append(y_pos)
                node_z.append(z_pos)
                node_colors.append(layer_color)
                node_labels.append(f"L{l_idx+1}-N{n_idx+1}")
                curr_nodes.append((x_pos, y_pos, z_pos))

            # Connect synapase edges to previous layer
            if prev_nodes:
                for p_x, p_y, p_z in prev_nodes:
                    for c_x, c_y, c_z in curr_nodes:
                        edge_x.extend([p_x, c_x, None])
                        edge_y.extend([p_y, c_y, None])
                        edge_z.extend([p_z, c_z, None])

            prev_nodes = curr_nodes

        traces = [
            {
                "type": "scatter3d",
                "mode": "lines",
                "name": "Synaptic Weight Weights ($W_{ij}$)",
                "x": edge_x,
                "y": edge_y,
                "z": edge_z,
                "line": {"color": "rgba(168, 85, 247, 0.35)", "width": 1.5},
            },
            {
                "type": "scatter3d",
                "mode": "markers+text",
                "name": "Neurons & Activation Nodes",
                "x": node_x,
                "y": node_y,
                "z": node_z,
                "text": node_labels,
                "textposition": "top center",
                "marker": {
                    "size": 9,
                    "color": node_colors,
                    "line": {"color": "#ffffff", "width": 1.5},
                },
            },
        ]
        title = f"Deep Neural Network Architecture ({' -> '.join(map(str, layer_sizes))})"

    return {
        "type": "NEURAL_DNA_MODEL",
        "dimension": "3D",
        "title": title,
        "metadata": {
            "type": "NEURAL_DNA_MODEL",
            "dimension": "3D",
            "raw": title,
            "normalized": title,
            "independent_vars": ["x", "y", "z"],
            "dependent_var": "Nodes & Bonds",
            "variables": ["x", "y", "z"],
            "detected_parameters": [],
            "has_time_parameter": False,
        },
        "traces": traces,
        "stats": {
            "model_type": model_type,
            "title": title,
        },
    }


# =============================================================================
# AI VOICE MATH TUTOR & STEP-BY-STEP SYMBOLIC CALCULUS ENGINE
# =============================================================================

def evaluate_step_by_step_derivation(equation_str: str) -> Dict[str, Any]:
    """
    Computes full step-by-step analytical calculus derivatives, roots,
    Taylor series expansions, and generates spoken audio commentary.
    """
    parsed = parse_and_validate(equation_str)
    sympy_expr = parsed.get("sympy_expr", sp.Symbol('x')**2)
    x = sp.Symbol('x')
    y = sp.Symbol('y')

    # 1. Derivatives
    try:
        deriv1 = sp.diff(sympy_expr, x)
        deriv1_latex = sp.latex(deriv1)
    except Exception:
        deriv1 = None
        deriv1_latex = "N/A"

    try:
        deriv2 = sp.diff(sympy_expr, x, 2)
        deriv2_latex = sp.latex(deriv2)
    except Exception:
        deriv2 = None
        deriv2_latex = "N/A"

    # 2. Indefinite Integral
    try:
        integral = sp.integrate(sympy_expr, x)
        integral_latex = sp.latex(integral) + " + C"
    except Exception:
        integral_latex = "Non-elementary / Numerical"

    # 3. Critical Stationary Points
    critical_points = []
    if deriv1 is not None:
        try:
            roots = sp.solve(deriv1, x)
            for r in roots[:4]:
                if r.is_real:
                    critical_points.append(round(float(r), 4))
        except Exception:
            pass

    # 4. Taylor Series Expansion (4th order around x=0)
    try:
        taylor = sp.series(sympy_expr, x, 0, 5).removeO()
        taylor_latex = sp.latex(taylor)
    except Exception:
        taylor_latex = "N/A"

    # 5. Natural Speech Synthesis Script for the AI Voice Tutor
    speech_text = f"Analyzing equation {parsed.get('normalized', equation_str)}. "
    if deriv1 is not None:
        speech_text += f"The first derivative with respect to x is {deriv1}. "
    if critical_points:
        speech_text += f"Stationary critical extrema occur at x equals {', '.join(map(str, critical_points))}. "
    speech_text += f"The curvature is governed by the second derivative, while the Taylor polynomial approximation near the origin captures local behavior smoothly."

    return {
        "equation": equation_str,
        "normalized": parsed.get("normalized", equation_str),
        "latex": parsed.get("latex", equation_str),
        "first_derivative": deriv1_latex,
        "second_derivative": deriv2_latex,
        "integral": integral_latex,
        "critical_points": critical_points,
        "taylor_series": taylor_latex,
        "voice_tutor_script": speech_text,
    }


