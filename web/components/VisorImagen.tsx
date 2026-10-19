"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, ImageIcon } from "lucide-react";
import { Ayuda } from "./Ayuda";

interface Props {
  src: string;
  alt: string;
  /** muestra la animación de escaneo mientras el modelo trabaja */
  analizando?: boolean;
  /** data URL del Grad-CAM; si viene, aparece el selector Original / Grad-CAM */
  gradcam?: string;
}

export function VisorImagen({ src, alt, analizando = false, gradcam }: Props) {
  const [verGradcam, setVerGradcam] = useState(false);
  const [intensidad, setIntensidad] = useState(85);
  const mostrarGradcam = Boolean(gradcam) && verGradcam;

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-contain" />

        {/* Grad-CAM superpuesto: se funde sobre la imagen original */}
        {gradcam && (
          <img
            src={gradcam}
            alt="Mapa de calor Grad-CAM: zonas que más influyeron en la decisión"
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500"
            style={{ opacity: mostrarGradcam ? intensidad / 100 : 0 }}
          />
        )}

        {/* Esquinas tipo visor médico */}
        <div className="pointer-events-none absolute inset-3" aria-hidden>
          <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-cyan-300/60" />
          <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-cyan-300/60" />
          <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-cyan-300/60" />
          <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-cyan-300/60" />
        </div>

        {/* Animación de escaneo: tinte + rejilla + línea que recorre la imagen */}
        <AnimatePresence>
          {analizando && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden
            >
              <div className="absolute inset-0 bg-cyan-500/10 [background-image:linear-gradient(rgb(34_211_238/0.12)_1px,transparent_1px),linear-gradient(90deg,rgb(34_211_238/0.12)_1px,transparent_1px)] [background-size:24px_24px]" />
              <motion.div
                className="scan-line absolute inset-x-0 h-24"
                initial={{ top: "-25%" }}
                animate={{ top: ["-25%", "100%"] }}
                transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
              />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-xs uppercase tracking-widest text-cyan-200">
                Analizando…
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {gradcam && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1" role="group" aria-label="Vista de la imagen">
              <button
                type="button"
                onClick={() => setVerGradcam(false)}
                aria-pressed={!verGradcam}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${!verGradcam ? "bg-cyan-400/20 text-cyan-100" : "text-slate-400 hover:text-slate-200"}`}
              >
                <ImageIcon className="h-4 w-4" aria-hidden /> Original
              </button>
              <button
                type="button"
                onClick={() => setVerGradcam(true)}
                aria-pressed={verGradcam}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${verGradcam ? "bg-cyan-400/20 text-cyan-100" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Flame className="h-4 w-4" aria-hidden /> Grad-CAM
              </button>
            </div>
            <Ayuda etiqueta="¿Qué es Grad-CAM?">
              Grad-CAM es una técnica de explicabilidad: colorea las zonas de la imagen que más influyeron en la decisión
              del modelo (rojo/amarillo = más influencia). Muestra <em>dónde miró</em> el modelo, no confirma que haya
              un tumor ahí.
            </Ayuda>
          </div>
          {verGradcam && (
            <label className="flex items-center gap-3 text-xs text-slate-400">
              Intensidad
              <input
                type="range"
                min={20}
                max={100}
                value={intensidad}
                onChange={(e) => setIntensidad(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </label>
          )}
          <p className="text-xs text-slate-400">
            {verGradcam
              ? "Las zonas cálidas son las que más influyeron en la decisión del modelo."
              : "Activa Grad-CAM para ver las zonas que más influyeron en la decisión."}
          </p>
        </div>
      )}
    </div>
  );
}
