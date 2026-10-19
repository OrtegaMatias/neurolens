"use client";

import { motion } from "framer-motion";
import type { Clase } from "@/lib/api";
import { porcentaje } from "@/lib/formato";

interface Props {
  clases: Clase[];
  probabilidades: Record<string, number>;
  claseGanadora: string;
}

// Barras animadas con la probabilidad de TODAS las clases (de mayor a menor).
export function BarrasProbabilidad({ clases, probabilidades, claseGanadora }: Props) {
  const ordenadas = [...clases].sort((a, b) => (probabilidades[b.id] ?? 0) - (probabilidades[a.id] ?? 0));

  return (
    <ul className="space-y-3">
      {ordenadas.map((clase, i) => {
        const p = probabilidades[clase.id] ?? 0;
        const ganadora = clase.id === claseGanadora;
        return (
          <li key={clase.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className={`flex items-center gap-2 ${ganadora ? "font-semibold text-white" : "text-slate-300"}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: clase.color }} aria-hidden />
                {clase.nombre}
              </span>
              <span className="font-mono tabular-nums text-slate-300">{porcentaje(p)}</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-white/5"
              role="meter"
              aria-label={`Probabilidad de ${clase.nombre}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(p * 100)}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: clase.color,
                  boxShadow: ganadora ? `0 0 12px ${clase.color}` : undefined,
                  opacity: ganadora ? 1 : 0.65,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(p * 100, 0.5)}%` }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
