"""
Math Engine for Graphx:
Converts LaTeX and standard mathematical equations into analytical structures,
detects equation types/dimensions, and generates high-fidelity numerical mesh/data for 1D, 2D, and 3D visualization.
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
}


def normalize_latex(text: str) -> str:
    """Normalize LaTeX notation into sympy-compatible string."""
    if not text:
        return ""
    
    s = text.strip()
    # Remove math mode delimiters $...$ or $$...$$ or \[ \] \( \)
    s = re.sub(r'^\$\$?(.*?)\$\$?$', r'\1', s, flags=re.DOTALL).strip()
    s = re.sub(r'^\\\[(.*?)\\\]$', r'\1', s, flags=re.DOTALL).strip()
    s = re.sub(r'^\\\((.*?)\\\)$', r'\1', s, flags=re.DOTALL).strip()
    
    # Common LaTeX replacements
    s = s.replace(r'\left', '').replace(r'\right', '')
    s = s.replace(r'\cdot', '*').replace(r'\times', '*')
    s = s.replace(r'\pi', 'pi')
    s = s.replace(r'\theta', 'theta')
    s = s.replace(r'\phi', 'phi')
    s = s.replace(r'\ln', 'log')
    s = s.replace(r'\exp', 'exp')
    
    # Handle \frac{a}{b} -> ((a)/(b))
    while r'\frac' in s:
        match = re.search(r'\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}', s)
        if match:
            num, den = match.group(1), match.group(2)
            s = s[:match.start()] + f"(({num})/({den}))" + s[match.end():]
        else:
            # Handle nested or unbalanced frac fallback
            s = re.sub(r'\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}', r'((\1)/(\2))', s)
            break

    # Handle \sqrt{a} -> sqrt(a) and \sqrt[n]{a} -> ((a)**(1/(n)))
    s = re.sub(r'\\sqrt\[([^\]]+)\]\{([^{}]+)\}', r'((\2)**(1/(\1)))', s)
    s = re.sub(r'\\sqrt\{([^{}]+)\}', r'sqrt(\1)', s)

    # Trig and math functions \sin, \cos, \tan, etc.
    s = re.sub(r'\\(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|abs)', r'\1', s)

    # Handle e^{...} -> exp(...)
    s = re.sub(r'\be\^\{([^{}]+)\}', r'exp(\1)', s)
    s = re.sub(r'\be\^([a-zA-Z0-9]+)', r'exp(\1)', s)

    # Handle general powers ^{...} -> **(...)
    s = re.sub(r'\^\{([^{}]+)\}', r'**(\1)', s)
    s = s.replace('^', '**')

    # Remove extra backslashes
    s = s.replace('\\', '')
    
    return s.strip()


def parse_and_validate(raw_input: str) -> Dict[str, Any]:
    """Parse equation, detect type, variables, and create Sympy representation."""
    cleaned = normalize_latex(raw_input)
    if not cleaned:
        raise ValueError("Equation input is empty.")

    # Check for parametric notation e.g. "x = cos(t), y = sin(t)" or "x(t)=..., y(t)=..."
    if ',' in cleaned or ';' in cleaned:
        parts = [p.strip() for p in re.split(r'[,;]', cleaned) if p.strip()]
        if len(parts) in (2, 3):
            # Parametric candidate
            param_dict = {}
            for part in parts:
                if '=' in part:
                    var, expr_str = part.split('=', 1)
                    var = var.strip().replace('(t)', '').replace('(u,v)', '').replace('(u)', '').replace('(v)', '')
                    param_dict[var] = expr_str.strip()
            
            if len(param_dict) >= 2:
                # Parse each component
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

    # Check for Polar equation "r = ..." or "r(theta) = ..."
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

    # Standard explicit or implicit equations
    lhs_str, rhs_str = None, None
    is_implicit = False

    if '=' in cleaned:
        parts = cleaned.split('=', 1)
        lhs_raw, rhs_raw = parts[0].strip(), parts[1].strip()
        lhs_parsed = parse_expr(lhs_raw, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
        rhs_parsed = parse_expr(rhs_raw, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
        
        # Check explicit formats: y = f(x), z = f(x, y), x = f(y)
        lhs_syms = [str(s) for s in lhs_parsed.free_symbols]
        rhs_syms = [str(s) for s in rhs_parsed.free_symbols]

        if len(lhs_syms) == 1 and lhs_raw in ('y', 'z', 'x', 'f(x)', 'f(x,y)'):
            dep = lhs_raw.split('(')[0]
            expr = rhs_parsed
            free_vars = rhs_syms
            eq_type = "EXPLICIT_3D" if dep == 'z' or (len(free_vars) >= 2 and 'y' in free_vars) else "EXPLICIT_2D"
            dim = "3D" if eq_type == "EXPLICIT_3D" else "2D"
            return {
                "type": eq_type,
                "dimension": dim,
                "raw": raw_input,
                "normalized": cleaned,
                "expression_str": str(expr),
                "sympy_expr": expr,
                "dependent_var": dep,
                "independent_vars": sorted(free_vars),
                "variables": sorted(list(set([dep] + free_vars))),
            }
        else:
            # Implicit equation: lhs - rhs = 0
            is_implicit = True
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
        # No '=' provided, treat as explicit expression e.g. "x^2 - 4*x + 3" or "sin(x)*cos(y)"
        expr = parse_expr(cleaned, local_dict=SAFE_SYMBOLS, transformations=TRANSFORMATIONS)
        free_vars = [str(s) for s in expr.free_symbols]
        
        if not free_vars:
            # Constant expression
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
    """Evaluates the mathematical equation over domain ranges and produces plot-ready data structures."""
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

    # 1. 1D or 2D EXPLICIT: y = f(x)
    if "EXPLICIT_2D" in eq_type or (dimension in ("1D", "2D") and eq_type == "EXPLICIT_2D"):
        sym_expr = parsed_meta["sympy_expr"]
        indep_var = parsed_meta["independent_vars"][0] if parsed_meta.get("independent_vars") else "x"
        sym_var = sp.Symbol(indep_var)
        
        x_min, x_max = ranges.get(indep_var, (-10.0, 10.0))
        n_pts = max(300, min(resolution * 3, 2000))
        x_vals = np.linspace(x_min, x_max, n_pts)

        f_lambdified = sp.lambdify(sym_var, sym_expr, modules=['numpy', {'sin': np.sin, 'cos': np.cos, 'tan': np.tan, 'exp': np.exp, 'log': np.log, 'sqrt': np.sqrt}])
        
        try:
            y_vals = f_lambdified(x_vals)
            if isinstance(y_vals, (int, float)):
                y_vals = np.full_like(x_vals, y_vals)
            
            # Mask extreme or non-finite values for asymptotic smoothness
            y_vals = np.asarray(y_vals, dtype=float)
            mask = np.isfinite(y_vals) & (np.abs(y_vals) < 1e6)
            
            # Detect discontinuities/asymptotes (e.g. tan(x), 1/x)
            diffs = np.abs(np.diff(y_vals, prepend=y_vals[0]))
            jump_threshold = max(20.0, 10.0 * np.nanmedian(diffs[mask])) if np.any(mask) else 100.0
            y_vals_clean = np.where(mask & (diffs < jump_threshold), y_vals, np.nan)
            
            # Compute analytical derivative for tangent analysis
            try:
                deriv_expr = sp.diff(sym_expr, sym_var)
                deriv_str = str(deriv_expr)
            except Exception:
                deriv_str = None

            # Calculate roots and extrema
            valid_y = y_vals_clean[np.isfinite(y_vals_clean)]
            stats = {
                "min_y": float(np.min(valid_y)) if len(valid_y) > 0 else None,
                "max_y": float(np.max(valid_y)) if len(valid_y) > 0 else None,
                "mean_y": float(np.mean(valid_y)) if len(valid_y) > 0 else None,
                "domain": [x_min, x_max],
                "derivative": deriv_str,
                "num_points": n_pts,
            }
            
            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": f"{parsed_meta.get('dependent_var', 'y')}({indep_var})",
                "x": x_vals.tolist(),
                "y": [None if np.isnan(v) else float(v) for v in y_vals_clean],
                "line": {"color": "#38bdf8", "width": 3},
            })
            result["stats"] = stats
            result["layout_recommendations"] = {
                "xaxis": {"title": indep_var, "gridcolor": "rgba(255,255,255,0.1)"},
                "yaxis": {"title": parsed_meta.get('dependent_var', 'y'), "gridcolor": "rgba(255,255,255,0.1)"},
            }
        except Exception as e:
            raise ValueError(f"Error evaluating explicit function: {str(e)}")

    # 2. 2D POLAR: r = f(theta)
    elif eq_type == "POLAR":
        sym_expr = parsed_meta["sympy_expr"]
        sym_theta = sp.Symbol('theta')
        t_min, t_max = ranges.get('theta', (0.0, 2 * math.pi))
        n_pts = max(400, resolution * 2)
        theta_vals = np.linspace(t_min, t_max, n_pts)

        f_polar = sp.lambdify(sym_theta, sym_expr, modules=['numpy'])
        r_vals = np.asarray(f_polar(theta_vals), dtype=float)
        
        # Cartesian conversion for 2D cartesian view option
        x_vals = r_vals * np.cos(theta_vals)
        y_vals = r_vals * np.sin(theta_vals)

        result["traces"].append({
            "type": "scatterpolar",
            "mode": "lines",
            "name": "r(θ)",
            "r": r_vals.tolist(),
            "theta": np.degrees(theta_vals).tolist(),
            "line": {"color": "#a855f7", "width": 3},
        })
        result["cartesian_trace"] = {
            "type": "scatter",
            "mode": "lines",
            "name": "r(θ) Cartesian",
            "x": x_vals.tolist(),
            "y": y_vals.tolist(),
            "line": {"color": "#a855f7", "width": 3},
        }
        result["stats"] = {
            "r_min": float(np.nanmin(r_vals)),
            "r_max": float(np.nanmax(r_vals)),
            "theta_range": [float(t_min), float(t_max)],
        }

    # 3. 2D / 3D PARAMETRIC
    elif eq_type == "PARAMETRIC":
        components = parsed_meta.get("sympy_components", {})
        param_var = parsed_meta.get("parameter_vars", ['t'])[0]
        sym_param = sp.Symbol(param_var)
        t_min, t_max = ranges.get(param_var, (0.0, 2 * math.pi))
        n_pts = max(400, resolution * 2)
        t_vals = np.linspace(t_min, t_max, n_pts)

        coord_data = {}
        for var, comp_expr in components.items():
            f_comp = sp.lambdify(sym_param, comp_expr, modules=['numpy'])
            coord_data[var] = np.asarray(f_comp(t_vals), dtype=float)

        if dimension == "3D" or 'z' in coord_data:
            z_vals = coord_data.get('z', np.zeros_like(t_vals))
            result["traces"].append({
                "type": "scatter3d",
                "mode": "lines",
                "name": "Parametric 3D Curve",
                "x": coord_data.get('x', t_vals).tolist(),
                "y": coord_data.get('y', t_vals).tolist(),
                "z": z_vals.tolist(),
                "line": {"color": "#ec4899", "width": 5},
            })
        else:
            result["traces"].append({
                "type": "scatter",
                "mode": "lines",
                "name": "Parametric 2D Curve",
                "x": coord_data.get('x', t_vals).tolist(),
                "y": coord_data.get('y', t_vals).tolist(),
                "line": {"color": "#ec4899", "width": 3},
            })
        result["stats"] = {
            "parameter": param_var,
            "range": [float(t_min), float(t_max)],
            "num_points": n_pts,
        }

    # 4. 2D IMPLICIT: f(x, y) = 0
    elif eq_type == "IMPLICIT_2D" or (dimension == "2D" and "IMPLICIT" in eq_type):
        sym_expr = parsed_meta["sympy_expr"]
        sym_x, sym_y = sp.Symbol('x'), sp.Symbol('y')
        x_min, x_max = ranges.get('x', (-10.0, 10.0))
        y_min, y_max = ranges.get('y', (-10.0, 10.0))
        
        n_grid = max(100, min(resolution, 250))
        x_grid = np.linspace(x_min, x_max, n_grid)
        y_grid = np.linspace(y_min, y_max, n_grid)
        X, Y = np.meshgrid(x_grid, y_grid)

        f_implicit = sp.lambdify((sym_x, sym_y), sym_expr, modules=['numpy'])
        Z_grid = f_implicit(X, Y)
        if isinstance(Z_grid, (int, float)):
            Z_grid = np.full_like(X, Z_grid)
        Z_grid = np.asarray(Z_grid, dtype=float)

        # Plotly contour plot specifically targeted at the zero-level isocline
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
        result["stats"] = {
            "grid_size": f"{n_grid}x{n_grid}",
            "x_domain": [x_min, x_max],
            "y_domain": [y_min, y_max],
            "min_val": float(np.nanmin(Z_grid)),
            "max_val": float(np.nanmax(Z_grid)),
        }

    # 5. 3D EXPLICIT SURFACE: z = f(x, y)
    elif "EXPLICIT_3D" in eq_type or (dimension == "3D" and eq_type in ("EXPLICIT_2D", "EXPLICIT_3D")):
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

        f_surface = sp.lambdify((sym_x, sym_y), sym_expr, modules=['numpy', {'sin': np.sin, 'cos': np.cos, 'tan': np.tan, 'exp': np.exp, 'log': np.log, 'sqrt': np.sqrt}])
        Z = f_surface(X, Y)
        if isinstance(Z, (int, float)):
            Z = np.full_like(X, Z)
        Z = np.asarray(Z, dtype=float)
        
        # Mask extreme values
        Z_clean = np.where(np.isfinite(Z) & (np.abs(Z) < 1e5), Z, np.nan)
        
        valid_z = Z_clean[np.isfinite(Z_clean)]
        min_z = float(np.min(valid_z)) if len(valid_z) > 0 else 0.0
        max_z = float(np.max(valid_z)) if len(valid_z) > 0 else 1.0

        # Primary Surface Trace
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

    # 6. 3D IMPLICIT ISOSURFACE: f(x, y, z) = 0
    elif "IMPLICIT_3D" in eq_type or (dimension == "3D" and "IMPLICIT" in eq_type):
        sym_expr = parsed_meta["sympy_expr"]
        sym_x, sym_y, sym_z = sp.Symbol('x'), sp.Symbol('y'), sp.Symbol('z')
        x_min, x_max = ranges.get('x', (-6.0, 6.0))
        y_min, y_max = ranges.get('y', (-6.0, 6.0))
        z_min, z_max = ranges.get('z', (-6.0, 6.0))

        n_grid = max(25, min(int(resolution * 0.4), 45))
        x_grid = np.linspace(x_min, x_max, n_grid)
        y_grid = np.linspace(y_min, y_max, n_grid)
        z_grid = np.linspace(z_min, z_max, n_grid)
        X, Y, Z = np.meshgrid(x_grid, y_grid, z_grid, indexing='ij')

        f_implicit3d = sp.lambdify((sym_x, sym_y, sym_z), sym_expr, modules=['numpy'])
        vol = f_implicit3d(X, Y, Z)
        if isinstance(vol, (int, float)):
            vol = np.full_like(X, vol)
        vol = np.asarray(vol, dtype=float)

        mesh_generated = False
        if HAS_SKIMAGE:
            try:
                # Marching cubes isosurface at 0 level
                if np.nanmin(vol) <= 0.0 <= np.nanmax(vol):
                    verts, faces, normals, values = measure.marching_cubes(vol, level=0.0, spacing=(
                        (x_max - x_min) / (n_grid - 1),
                        (y_max - y_min) / (n_grid - 1),
                        (z_max - z_min) / (n_grid - 1),
                    ))
                    # Shift vertices to correct domain origin
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
                        "name": "3D Isosurface f(x,y,z)=0",
                    })
                    mesh_generated = True
                    result["stats"] = {
                        "vertices": len(verts),
                        "triangles": len(faces),
                        "grid": f"{n_grid}^3",
                    }
            except Exception:
                mesh_generated = False

        if not mesh_generated:
            # Point cloud fallback for near-zero points
            abs_vol = np.abs(vol)
            thresh = np.nanpercentile(abs_vol, 3.0)
            close_idx = np.where(abs_vol <= thresh)
            
            result["traces"].append({
                "type": "scatter3d",
                "mode": "markers",
                "x": X[close_idx].tolist(),
                "y": Y[close_idx].tolist(),
                "z": Z[close_idx].tolist(),
                "marker": {
                    "size": 3,
                    "color": "#06b6d4",
                    "opacity": 0.7,
                },
                "name": "3D Implicit Point Cloud",
            })
            result["stats"] = {
                "points": len(close_idx[0]),
                "grid": f"{n_grid}^3",
            }

    return result
