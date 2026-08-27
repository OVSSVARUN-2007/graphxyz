"""
Math Engine for Graphxyz:
Universal mathematical parser and multi-dimensional numerical evaluator.
Supports any arbitrary algebraic expression, LaTeX notation, explicit, implicit,
polar, and parametric equations in 1D, 2D, and 3D dimensions.
"""

import re
import math
import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
)
from typing import Dict, Any, List, Optional, Tuple

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
    'pi': sp.pi,
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
    s = s.replace('θ', 'theta').replace('π', 'pi').replace('ϕ', 'phi').replace('φ', 'phi')
    s = s.replace('²', '^2').replace('³', '^3').replace('·', '*').replace('×', '*').replace('÷', '/')
    
    # Common LaTeX replacements
    s = s.replace(r'\left', '').replace(r'\right', '')
    s = s.replace(r'\cdot', '*').replace(r'\times', '*').replace(r'\div', '/')
    s = s.replace(r'\theta', 'theta').replace(r'\Theta', 'theta')
    s = s.replace(r'\pi', 'pi').replace(r'\Pi', 'pi')
    s = s.replace(r'\phi', 'phi').replace(r'\Phi', 'phi')
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

    # Handle e^{...} -> exp(...)
    s = re.sub(r'\be\^\{([^{}]+)\}', r'exp(\1)', s)
    s = re.sub(r'\be\^([a-zA-Z0-9]+)', r'exp(\1)', s)

    # Handle general powers ^{...} -> **(...)
    s = re.sub(r'\^\{([^{}]+)\}', r'**(\1)', s)
    s = s.replace('^', '**')

    # Remove extra stray backslashes
    s = s.replace('\\', '')
    
    return s.strip()


def parse_and_validate(raw_input: str) -> Dict[str, Any]:
    """Parse equation, detect type, variables, and create analytical representation."""
    cleaned = normalize_latex(raw_input)
    if not cleaned:
        raise ValueError("Equation input is empty.")

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
            
            if dep == 'z' or len(free_vars) >= 2:
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
                "independent_vars": sorted(free_vars) if free_vars else ['x'],
                "variables": sorted(list(set([dep] + free_vars))),
            }
        else:
            # Implicit format: LHS - RHS = 0
            expr = sp.simplify(lhs_parsed - rhs_parsed)
            free_vars = [str(s) for s in expr.free_symbols]
            dim = "3D" if ('z' in free_vars or len(free_vars) >= 3) else "2D"
            return {
                "type": f"IMPLICIT_{dim}",
                "dimension": dim,
                "raw": raw_input,
                "normalized": cleaned,
                "expression_str": str(expr),
                "sympy_expr": expr,
                "independent_vars": sorted(free_vars),
                "variables": sorted(free_vars),
            }
    else:
        # Pure expression without '=' (e.g. "x^2 - 4x + 3", "sin(x)cos(y)", "x/y")
        expr = parse_expr(cleaned, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
        free_vars = [str(s) for s in expr.free_symbols]
        
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
            }


def evaluate_equation(
    parsed_meta: Dict[str, Any],
    domain_ranges: Optional[Dict[str, Tuple[float, float]]] = None,
    resolution: int = 200,
    dimension_override: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Universal Evaluator:
    Accurately computes numerical plot structures for any equation in 1D, 2D, or 3D.
    """
    eq_type = parsed_meta.get("type", "EXPLICIT_2D")
    dimension = dimension_override if dimension_override and dimension_override != "AUTO" else parsed_meta.get("dimension", "2D")

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
