"use client";

import { motion } from "framer-motion";
import type { Clase } from "@/lib/api";
import { porcentaje } from "@/lib/formato";

interface Props {
  clases: Clase[]; // mismo orden que filas/columnas de la matriz
  matriz: number[][]; // filas = clase real, columnas = clase predicha
}

// Mapa de calor de la matriz de confusión hecho con CSS grid.
// La intensidad de cada celda = proporción respecto del total de su fila (clase real).
export function MatrizConfusion({ clases, matriz }: Props) {
  const idxSinTumor = clases.findIndex((c) => c.id === "notumor");
  const n = clases.length;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[30rem]">
        <p className="mb-2 pl-28 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
          Clase predicha por el modelo →
        </p>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `7rem repeat(${n}, minmax(0, 1fr))` }}>
          {/* Encabezado de columnas */}
          <div className="flex items-end text-[11px] font-medium uppercase tracking-wider text-slate-400">Real ↓</div>
          {clases.map((c) => (
            <div key={c.id} className="flex items-end justify-center gap-1.5 pb-1 text-center text-xs text-slate-300">
              <span className="mb-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
              {c.nombre}
            </div>
          ))}

          {matriz.map((fila, i) => {
            const totalFila = fila.reduce((a, b) => a + b, 0) || 1;
            return [
              <div key={`f${i}`} className="flex items-center gap-1.5 pr-2 text-xs text-slate-300">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: clases[i]?.color }} aria-hidden />
                {clases[i]?.nombre}
              </div>,
              ...fila.map((valor, j) => {
                const proporcion = valor / totalFila;
                const acierto = i === j;
                // Falso negativo: hay tumor (fila ≠ sin tumor) pero el modelo dijo "Sin tumor"
                const falsoNegativo = j === idxSinTumor && i !== idxSinTumor;
                const rgb = acierto ? "34 211 238" : "244 63 94";
                return (
                  <motion.div
                    key={`${i}-${j}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i * n + j) * 0.025 }}
                    title={`Real: ${clases[i]?.nombre} · Predicha: ${clases[j]?.nombre} · ${valor} imágenes (${porcentaje(proporcion)} de la fila)`}
                    className={`flex h-16 flex-col items-center justify-center rounded-xl border sm:h-20 ${
                      falsoNegativo && valor > 0 ? "border-amber-300/80 border-dashed" : "border-white/5"
                    }`}
                    style={{
                      backgroundColor: `rgb(${rgb} / ${valor === 0 ? 0.03 : 0.08 + proporcion * 0.72})`,
                    }}
                  >
                    <span
                      className={`font-display text-lg font-semibold tabular-nums ${
                        proporcion > 0.5 ? "text-slate-950" : "text-slate-100"
                      }`}
                    >
                      {valor}
                    </span>
                    <span className={`text-[10px] tabular-nums ${proporcion > 0.5 ? "text-slate-900" : "text-slate-400"}`}>
                      {porcentaje(proporcion, 0)}
                    </span>
                  </motion.div>
                );
              }),
            ];
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 pl-28 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400/70" /> Aciertos (diagonal)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/70" /> Errores
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-amber-300" /> Falsos negativos (tumor → &quot;Sin tumor&quot;)
          </span>
        </div>
      </div>
    </div>
  );
}
