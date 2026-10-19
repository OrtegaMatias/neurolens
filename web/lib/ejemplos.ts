import type { ClaseId } from "./api";

export interface Ejemplo {
  /** ruta pública de la imagen, p. ej. /ejemplos/glioma.jpg */
  src: string;
  /** clase real (etiqueta del dataset) */
  clase: ClaseId;
}

// Imágenes de ejemplo incluidas en public/ejemplos/ (una por clase)
export const EJEMPLOS: Ejemplo[] = [
  { src: "/ejemplos/glioma.jpg", clase: "glioma" },
  { src: "/ejemplos/meningioma.jpg", clase: "meningioma" },
  { src: "/ejemplos/notumor.jpg", clase: "notumor" },
  { src: "/ejemplos/pituitary.jpg", clase: "pituitary" },
];

const IDS_VALIDOS: ClaseId[] = ["glioma", "meningioma", "notumor", "pituitary"];

export function esClaseId(valor: unknown): valor is ClaseId {
  return IDS_VALIDOS.some((id) => id === valor);
}

/**
 * Carga el banco de imágenes del desafío desde public/ejemplos/desafio.json
 * (formato: [{ "archivo": "desafio/xxx.jpg", "clase": "glioma" }, ...]).
 * Si el archivo no existe o está mal formado, usa los 4 ejemplos básicos.
 */
export async function cargarBancoDesafio(): Promise<Ejemplo[]> {
  try {
    const res = await fetch("/ejemplos/desafio.json", { cache: "no-store" });
    if (!res.ok) return EJEMPLOS;
    const datos: unknown = await res.json();
    if (!Array.isArray(datos)) return EJEMPLOS;
    const items: unknown[] = datos;
    const banco: Ejemplo[] = [];
    for (const item of items) {
      if (
        item &&
        typeof item === "object" &&
        "archivo" in item &&
        "clase" in item &&
        typeof item.archivo === "string" &&
        esClaseId(item.clase)
      ) {
        banco.push({ src: `/ejemplos/${item.archivo.replace(/^\/+/, "")}`, clase: item.clase });
      }
    }
    return banco.length ? banco : EJEMPLOS;
  } catch {
    return EJEMPLOS;
  }
}

/** Descarga una imagen pública como Blob para enviarla a /api/predict. */
export async function descargarEjemplo(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`No se encontró la imagen de ejemplo (${src}).`);
  return res.blob();
}
