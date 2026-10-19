/** Convierte una proporción (0–1) en porcentaje con formato chileno: 0.9234 → "92,3%". */
export function porcentaje(proporcion: number, decimales = 1): string {
  return `${(proporcion * 100).toLocaleString("es-CL", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}%`;
}
