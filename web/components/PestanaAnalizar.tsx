"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, ImagePlus, Layers, RefreshCw, ServerCrash, Sparkles } from "lucide-react";
import { ApiError, predecir, type Clase, type Metricas, type Prediccion } from "@/lib/api";
import { agregarAlHistorial } from "@/lib/almacenamiento";
import { descargarEjemplo, type Ejemplo } from "@/lib/ejemplos";
import { crearMiniatura } from "@/lib/imagen";
import { PanelResultado } from "./PanelResultado";
import { TarjetaRecomendacion } from "./TarjetaRecomendacion";
import { VisorImagen } from "./VisorImagen";
import { ZonaCarga } from "./ZonaCarga";

interface ImagenActual {
  url: string; // object URL para mostrarla en pantalla
  blob: Blob;
  nombre: string;
}

type Estado =
  | { tipo: "vacio" }
  | { tipo: "analizando" }
  | { tipo: "listo"; prediccion: Prediccion; id: number }
  | { tipo: "error"; mensaje: string; sinConexion: boolean };

// Duración mínima de la animación de escaneo, para que se alcance a percibir
const ESCANEO_MINIMO_MS = 900;

interface Props {
  clases: Clase[];
  metricas?: Metricas;
}

export function PestanaAnalizar({ clases, metricas }: Props) {
  const [imagen, setImagen] = useState<ImagenActual | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: "vacio" });
  const controlador = useRef<AbortController | null>(null);

  // Liberamos la memoria del object URL anterior cuando cambia la imagen
  useEffect(() => {
    if (!imagen) return;
    return () => URL.revokeObjectURL(imagen.url);
  }, [imagen]);

  useEffect(() => () => controlador.current?.abort(), []);

  const analizar = async (blob: Blob, nombre: string) => {
    controlador.current?.abort();
    const c = new AbortController();
    controlador.current = c;

    if (imagen?.blob !== blob) setImagen({ url: URL.createObjectURL(blob), blob, nombre });
    setEstado({ tipo: "analizando" });

    const pausaMinima = Promise.withResolvers<void>();
    setTimeout(pausaMinima.resolve, ESCANEO_MINIMO_MS);

    try {
      const [prediccion] = await Promise.all([predecir(blob, nombre, c.signal), pausaMinima.promise]);
      if (c.signal.aborted) return;
      // `id` único por análisis: reinicia la tarjeta de recomendación en cada nuevo resultado
      setEstado({ tipo: "listo", prediccion, id: Date.now() });

      // Guardamos una miniatura liviana en el historial (localStorage)
      crearMiniatura(blob)
        .then((miniatura) =>
          agregarAlHistorial({
            // (crypto.randomUUID solo existe en https; esto funciona también al probar por http en la red local)
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            miniatura,
            clase: prediccion.clase,
            nombre: prediccion.nombre,
            confianza: prediccion.confianza,
            bajaConfianza: prediccion.baja_confianza,
            fecha: new Date().toISOString(),
            origen: nombre,
          }),
        )
        .catch(() => {
          // si no se pudo crear la miniatura, simplemente no se guarda en el historial
        });
    } catch (err) {
      if (c.signal.aborted) return;
      setEstado({
        tipo: "error",
        mensaje: err instanceof Error ? err.message : "Ocurrió un error inesperado.",
        sinConexion: err instanceof ApiError && err.status === null,
      });
    }
  };

  const usarEjemplo = async (ejemplo: Ejemplo) => {
    try {
      const blob = await descargarEjemplo(ejemplo.src);
      await analizar(blob, ejemplo.src.split("/").pop() ?? "ejemplo.jpg");
    } catch (err) {
      setEstado({
        tipo: "error",
        mensaje: err instanceof Error ? err.message : "No se pudo cargar el ejemplo.",
        sinConexion: false,
      });
    }
  };

  const reiniciar = () => {
    controlador.current?.abort();
    setImagen(null);
    setEstado({ tipo: "vacio" });
  };

  const analizando = estado.tipo === "analizando";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Columna izquierda: imagen */}
        <section className="glass rounded-3xl p-5 sm:p-6" aria-label="Imagen a analizar">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-white">
            <Layers className="h-5 w-5 text-cyan-300" aria-hidden />
            {imagen ? "Imagen analizada" : "1 · Sube una resonancia"}
          </h2>
          {imagen ? (
            <div className="space-y-4">
              <VisorImagen
                key={imagen.url}
                src={imagen.url}
                alt={`Resonancia cargada: ${imagen.nombre}`}
                analizando={analizando}
                gradcam={estado.tipo === "listo" ? estado.prediccion.gradcam : undefined}
              />
              <button
                type="button"
                onClick={reiniciar}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-100"
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                Analizar otra imagen
              </button>
            </div>
          ) : (
            <ZonaCarga
              clases={clases}
              deshabilitado={analizando}
              onArchivo={(archivo) => analizar(archivo, archivo.name)}
              onEjemplo={usarEjemplo}
            />
          )}
        </section>

        {/* Columna derecha: resultado */}
        <section className="glass rounded-3xl p-5 sm:p-6" aria-label="Resultado" aria-live="polite">
          <AnimatePresence mode="wait">
            {estado.tipo === "vacio" && (
              <motion.div key="vacio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ComoFunciona />
              </motion.div>
            )}
            {estado.tipo === "analizando" && (
              <motion.div key="analizando" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Esqueleto />
              </motion.div>
            )}
            {estado.tipo === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="alert"
                className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center"
              >
                <ServerCrash className="h-10 w-10 text-rose-300" aria-hidden />
                <div>
                  <p className="font-display text-lg font-semibold text-white">
                    {estado.sinConexion ? "Despertando el servidor…" : "No pudimos analizar la imagen"}
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{estado.mensaje}</p>
                </div>
                {imagen && (
                  <button
                    type="button"
                    onClick={() => analizar(imagen.blob, imagen.nombre)}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Reintentar
                  </button>
                )}
              </motion.div>
            )}
            {estado.tipo === "listo" && (
              <motion.div key="listo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PanelResultado prediccion={estado.prediccion} clases={clases} metricas={metricas} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {estado.tipo === "listo" && <TarjetaRecomendacion key={estado.id} prediccion={estado.prediccion} />}
    </div>
  );
}

function ComoFunciona() {
  const pasos = [
    { icono: ImagePlus, titulo: "Sube una imagen", texto: "Una resonancia magnética cerebral, o elige uno de los ejemplos." },
    {
      icono: Brain,
      titulo: "El modelo la clasifica",
      texto: "Una red YOLO-cls nano, ajustada con resonancias, estima la probabilidad de cada una de las 4 clases y muestra dónde miró (Grad-CAM).",
    },
    {
      icono: Sparkles,
      titulo: "La IA lo explica",
      texto: "Claude (Anthropic) redacta una recomendación educativa en lenguaje simple. Nunca es un diagnóstico.",
    },
  ];
  return (
    <div className="py-2">
      <h2 className="font-display text-lg font-semibold text-white">¿Cómo funciona?</h2>
      <ol className="mt-5 space-y-5">
        {pasos.map(({ icono: Icono, titulo, texto }, i) => (
          <li key={titulo} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/25">
              <Icono className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-medium text-slate-100">
                <span className="mr-1 font-mono text-cyan-300/70">{i + 1}.</span> {titulo}
              </p>
              <p className="text-sm text-slate-400">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-slate-500">
        Las imágenes se envían al servidor solo para ser clasificadas y no se almacenan. El historial queda guardado
        únicamente en tu navegador.
      </p>
    </div>
  );
}

// Marcadores grises mientras llega la predicción
function Esqueleto() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Analizando la imagen">
      <div className="h-3 w-40 rounded bg-white/10" />
      <div className="h-9 w-56 rounded bg-white/10" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-2xl bg-white/5" />
        <div className="h-28 rounded-2xl bg-white/5" />
      </div>
      <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-2.5 rounded-full bg-white/10" style={{ width: `${90 - i * 18}%` }} />
        ))}
      </div>
    </div>
  );
}
