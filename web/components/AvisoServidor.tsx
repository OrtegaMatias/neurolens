"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, RefreshCw, ServerCrash } from "lucide-react";
import type { EstadoServidor } from "@/lib/useInfoServidor";

interface Props {
  estado: EstadoServidor;
  intento: number;
  maxIntentos: number;
  onReintentar: () => void;
}

// Aviso amable mientras el backend (Hugging Face Spaces) arranca desde cero.
export function AvisoServidor({ estado, intento, maxIntentos, onReintentar }: Props) {
  const visible = estado === "despertando" || estado === "caido";
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          role="status"
          className="glass mb-6 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          {estado === "despertando" ? (
            <div className="flex items-start gap-3">
              <LoaderCircle className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-cyan-300" aria-hidden />
              <div>
                <p className="font-medium text-slate-100">Despertando el servidor…</p>
                <p className="text-sm text-slate-400">
                  El modelo vive en un servidor gratuito que se duerme cuando nadie lo usa. Puede tardar unos 30
                  segundos en arrancar; reintentamos automáticamente
                  {intento > 0 && ` (intento ${intento} de ${maxIntentos})`}.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <ServerCrash className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden />
              <div>
                <p className="font-medium text-slate-100">No pudimos conectar con el servidor</p>
                <p className="text-sm text-slate-400">
                  Puede estar en mantenimiento o sin conexión. Las pestañas educativas siguen disponibles.
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onReintentar}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reintentar ahora
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
