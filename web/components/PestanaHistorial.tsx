"use client";

import { AnimatePresence, motion } from "framer-motion";
import { History, Trash2, TriangleAlert } from "lucide-react";
import type { Clase } from "@/lib/api";
import { borrarHistorial, useHistorial } from "@/lib/almacenamiento";
import { porcentaje } from "@/lib/formato";

const formatoFecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });

export function PestanaHistorial({ clases }: { clases: Clase[] }) {
  const historial = useHistorial();

  return (
    <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby="titulo-historial">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="titulo-historial" className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <History className="h-5 w-5 text-cyan-300" aria-hidden />
            Tus últimos análisis
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Se guardan solo en este navegador (localStorage), con una miniatura reducida. No se envían a ningún servidor.
          </p>
        </div>
        <button
          type="button"
          disabled={historial.length === 0}
          onClick={() => {
            if (window.confirm("¿Borrar todo el historial de este navegador?")) borrarHistorial();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Borrar historial
        </button>
      </div>

      {historial.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-400">
          Aún no hay análisis. Sube una imagen en la pestaña <span className="text-cyan-300">Analizar</span> y aparecerá
          aquí.
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {historial.map((h) => {
              const color = clases.find((c) => c.id === h.clase)?.color ?? "#22d3ee";
              return (
                <motion.li
                  key={h.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <img
                    src={h.miniatura}
                    alt={`Miniatura de ${h.origen}`}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-xl border border-white/10 bg-black object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium" style={{ color }}>
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                      <span className="truncate">{h.nombre}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-300">
                      Confianza <span className="font-mono tabular-nums">{porcentaje(h.confianza)}</span>
                      {h.bajaConfianza && (
                        <TriangleAlert className="h-3.5 w-3.5 text-amber-300" aria-label="Bajo el umbral: requiere revisión humana" />
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500" title={h.origen}>
                      {formatoFecha.format(new Date(h.fecha))} · {h.origen}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
