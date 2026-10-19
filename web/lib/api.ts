// Cliente tipado para el backend FastAPI (app.py).
// La URL base se define en NEXT_PUBLIC_API_URL (ver .env.example).

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860").replace(/\/+$/, "");

export type ClaseId = "glioma" | "meningioma" | "notumor" | "pituitary";

export interface Clase {
  id: ClaseId;
  nombre: string;
  descripcion: string;
  color: string;
}

export interface Metricas {
  modelo: string;
  accuracy: number;
  balanced_accuracy: number;
  n_test: number;
  recall_por_clase: Record<string, number>;
  precision_por_clase: Record<string, number>;
  /** filas = clase real, columnas = clase predicha, en el mismo orden que `clases` */
  matriz_confusion: number[][];
  comparacion: { modelo: string; balanced_accuracy: number }[];
}

export interface Info {
  clases: Clase[];
  /** umbral de confianza calibrado en validación: bajo este valor se pide revisión humana */
  umbral: number;
  metricas: Metricas;
}

export interface Prediccion {
  clase: ClaseId;
  nombre: string;
  confianza: number;
  probabilidades: Record<string, number>;
  baja_confianza: boolean;
  umbral: number;
  /** imagen PNG en base64 (data URL) con el mapa de calor Grad-CAM superpuesto */
  gradcam: string;
}

/** Error de la API con un mensaje listo para mostrar en la interfaz. */
export class ApiError extends Error {
  /** código HTTP, o null si ni siquiera se pudo conectar (servidor caído o despertando) */
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const MENSAJE_SIN_CONEXION =
  "No pudimos conectar con el servidor. Si estuvo inactivo puede tardar ~30 segundos en despertar; vuelve a intentarlo.";

// fetch con tiempo límite; los errores de red se traducen a ApiError(status = null)
async function solicitar(ruta: string, init: RequestInit = {}, timeoutMs = 60_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Si quien llama también entrega una señal, la propagamos
  init.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const res = await fetch(`${API_URL}${ruta}`, { ...init, signal: controller.signal });
    if (!res.ok) throw await errorDesdeRespuesta(res);
    return res;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (init.signal?.aborted) throw err; // cancelado a propósito: no es un error de red
    throw new ApiError(MENSAJE_SIN_CONEXION, null);
  } finally {
    clearTimeout(timer);
  }
}

// FastAPI responde errores como { "detail": "..." }
async function errorDesdeRespuesta(res: Response): Promise<ApiError> {
  let detalle = "";
  try {
    const data: unknown = await res.json();
    if (data && typeof data === "object" && "detail" in data) {
      detalle = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    }
  } catch {
    // la respuesta no era JSON; usamos un mensaje genérico
  }
  if (!detalle) {
    detalle =
      res.status >= 500 ? `El servidor tuvo un problema (error ${res.status}).` : `Solicitud inválida (error ${res.status}).`;
  }
  return new ApiError(detalle, res.status);
}

export async function obtenerInfo(signal?: AbortSignal): Promise<Info> {
  const res = await solicitar("/api/info", { signal }, 20_000);
  return (await res.json()) as Info;
}

export async function predecir(imagen: Blob, nombreArchivo = "imagen.jpg", signal?: AbortSignal): Promise<Prediccion> {
  const form = new FormData();
  form.append("file", imagen, nombreArchivo);
  // El primer request tras un "cold start" puede tardar bastante: damos 90 s
  const res = await solicitar("/api/predict", { method: "POST", body: form, signal }, 90_000);
  return (await res.json()) as Prediccion;
}

export interface SolicitudRecomendacion {
  clase: ClaseId;
  confianza: number;
  probabilidades: Record<string, number>;
}

/**
 * Envía `datos` como JSON a una ruta que responde texto en streaming y entrega
 * cada trozo a `alRecibir`, para mostrarlo a medida que el LLM lo genera.
 */
async function leerStreamTexto(
  ruta: string,
  datos: unknown,
  alRecibir: (trozo: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await solicitar(
    ruta,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), signal },
    120_000,
  );
  if (!res.body) {
    alRecibir(await res.text());
    return;
  }
  const lector = res.body.getReader();
  const decodificador = new TextDecoder();
  while (true) {
    const { done, value } = await lector.read();
    if (done) break;
    // stream: true evita cortar caracteres UTF-8 (tildes, ñ) que lleguen partidos entre trozos
    alRecibir(decodificador.decode(value, { stream: true }));
  }
  const resto = decodificador.decode();
  if (resto) alRecibir(resto);
}

/** Recomendación educativa de Claude (vía backend) sobre una predicción, en streaming. */
export async function recomendar(
  datos: SolicitudRecomendacion,
  alRecibir: (trozo: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  await leerStreamTexto("/api/recomendar", datos, alRecibir, signal);
}

export interface SolicitudExplicacionDesafio {
  clase_real: ClaseId;
  /** clase elegida por la persona */
  eleccion: ClaseId;
  /** clase predicha por el modelo */
  prediccion: ClaseId;
  confianza: number;
  probabilidades: Record<string, number>;
}

/** Explicación de Claude de por qué la persona y/o la IA se equivocaron en una ronda del desafío. */
export async function explicarDesafio(
  datos: SolicitudExplicacionDesafio,
  alRecibir: (trozo: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  await leerStreamTexto("/api/explicar-desafio", datos, alRecibir, signal);
}
