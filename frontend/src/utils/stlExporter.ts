/**
 * 3D STL & OBJ Exporter Utility for Graphxyz:
 * Converts 3D Surface meshes into downloadable 3D printable files.
 */

export function exportSurfaceToSTL(
    surfaceTrace: { x: number[]; y: number[]; z: number[][] },
    fileName: string = "graphxyz_model.stl",
): boolean {
    try {
        const { x, y, z } = surfaceTrace;
        if (!x || !y || !z || !z.length || !z[0].length) {
            alert("No valid 3D surface geometry found to export.");
            return false;
        }

        const nY = y.length;
        const nX = x.length;

        let stl = "solid GraphxyzSurface\n";

        const getNormal = (
            p1: [number, number, number],
            p2: [number, number, number],
            p3: [number, number, number],
        ): [number, number, number] => {
            const u = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
            const v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
            const nx = u[1] * v[2] - u[2] * v[1];
            const ny = u[2] * v[0] - u[0] * v[2];
            const nz = u[0] * v[1] - u[1] * v[0];
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            return [nx / len, ny / len, nz / len];
        };

        for (let i = 0; i < nY - 1; i++) {
            for (let j = 0; j < nX - 1; j++) {
                const z1 = z[i][j];
                const z2 = z[i][j + 1];
                const z3 = z[i + 1][j + 1];
                const z4 = z[i + 1][j];

                if (
                    !isFinite(z1) ||
                    !isFinite(z2) ||
                    !isFinite(z3) ||
                    !isFinite(z4) ||
                    z1 === null ||
                    z2 === null ||
                    z3 === null ||
                    z4 === null
                ) {
                    continue;
                }

                const v1: [number, number, number] = [x[j], y[i], z1];
                const v2: [number, number, number] = [x[j + 1], y[i], z2];
                const v3: [number, number, number] = [x[j + 1], y[i + 1], z3];
                const v4: [number, number, number] = [x[j], y[i + 1], z4];

                // Triangle 1: v1, v2, v3
                const n1 = getNormal(v1, v2, v3);
                stl += `  facet normal ${n1[0].toFixed(5)} ${n1[1].toFixed(5)} ${n1[2].toFixed(5)}\n`;
                stl += `    outer loop\n`;
                stl += `      vertex ${v1[0].toFixed(5)} ${v1[1].toFixed(5)} ${v1[2].toFixed(5)}\n`;
                stl += `      vertex ${v2[0].toFixed(5)} ${v2[1].toFixed(5)} ${v2[2].toFixed(5)}\n`;
                stl += `      vertex ${v3[0].toFixed(5)} ${v3[1].toFixed(5)} ${v3[2].toFixed(5)}\n`;
                stl += `    endloop\n`;
                stl += `  endfacet\n`;

                // Triangle 2: v1, v3, v4
                const n2 = getNormal(v1, v3, v4);
                stl += `  facet normal ${n2[0].toFixed(5)} ${n2[1].toFixed(5)} ${n2[2].toFixed(5)}\n`;
                stl += `    outer loop\n`;
                stl += `      vertex ${v1[0].toFixed(5)} ${v1[1].toFixed(5)} ${v1[2].toFixed(5)}\n`;
                stl += `      vertex ${v3[0].toFixed(5)} ${v3[1].toFixed(5)} ${v3[2].toFixed(5)}\n`;
                stl += `      vertex ${v4[0].toFixed(5)} ${v4[1].toFixed(5)} ${v4[2].toFixed(5)}\n`;
                stl += `    endloop\n`;
                stl += `  endfacet\n`;
            }
        }

        stl += "endsolid GraphxyzSurface\n";

        const blob = new Blob([stl], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch (err) {
        console.error("Failed generating STL:", err);
        return false;
    }
}
