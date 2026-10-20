"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Sparkles, X } from "lucide-react";
import { useAccesoIA } from "@/lib/accesoIA";
import { FormularioClave } from "./FormularioClave";

// Insignia del encabezado: "Modo invitado" (con botón para desbloquear) o "IA generativa activa".
export function InsigniaIA() {
  const { ia, activarIA } = useAccesoIA();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  // Cierra el panel al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!abierto) return;
    const alClic = (e: MouseEvent) => {
      if (e.target instanceof Node && !contenedor.current?.contains(e.target)) setAbierto(false);
    };
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierto]);

  if (ia) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">IA generativa activa</span>
        <span className="sm:hidden">IA activa</span>
      </span>
    );
  }

  return (
    <div ref={contenedor} className="relative">
      <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 py-0.5 pl-3 pr-0.5 text-xs text-slate-300">
        <span className="hidden sm:inline">Modo invitado</span>
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-2.5 py-0.5 text-cyan-100 transition hover:bg-cyan-400/25"
        >
          <Lock className="h-3 w-3" aria-hidden />
          Desbloquear IA
        </button>
      </div>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-xl backdrop-blur"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-100">Desbloquear la IA generativa</p>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="text-slate-400 transition hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Ingresa la clave del día para activar las recomendaciones y explicaciones de Claude Haiku.
            </p>
            <FormularioClave
              compacto
              autoFocus
              textoBoton="Desbloquear"
              onExito={() => {
                activarIA();
                setAbierto(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
