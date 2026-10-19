"use client";

import { motion } from "framer-motion";
import { porcentaje } from "@/lib/formato";

interface Props {
  comparacion: { modelo: string; balanced_accuracy: number }[];
  modeloElegido: string;
}

// Gráfico de barras horizontales: balanced accuracy de cada enfoque probado
export function ComparacionModelos({ comparacion, modeloElegido }: Props) {
  const ordenados = [...comparacion].sort((a, b) => b.balanced_accuracy - a.balanced_accuracy);

  return (
    <ul className="space-y-4">
      {ordenados.map((m, i) => {
        // El nombre en la comparación puede traer detalles extra, p. ej. "YOLO-cls nano (ultralytics)"
        const elegido = m.modelo.toLowerCase().includes(modeloElegido.toLowerCase());
        return (
          <li key={m.modelo}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className={elegido ? "font-semibold text-white" : "text-slate-300"}>
                {m.modelo}
                {elegido && (
                  <span className="ml-2 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-200">
                    usado en la app
                  </span>
                )}
              </span>
              <span className="font-mono tabular-nums text-slate-300">{porcentaje(m.balanced_accuracy)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className={`h-full rounded-full ${elegido ? "bg-gradient-to-r from-cyan-400 to-teal-300" : "bg-slate-500/70"}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${m.balanced_accuracy * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
