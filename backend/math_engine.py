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

    return result
