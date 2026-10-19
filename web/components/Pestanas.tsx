"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChartColumn, History, ScanLine, Swords, type LucideIcon } from "lucide-react";

export type PestanaId = "analizar" | "desafio" | "aprende" | "modelo" | "historial";

export const PESTANAS: { id: PestanaId; etiqueta: string; icono: LucideIcon }[] = [
  { id: "analizar", etiqueta: "Analizar", icono: ScanLine },
  { id: "desafio", etiqueta: "Desafío: humano vs IA", icono: Swords },
  { id: "aprende", etiqueta: "Aprende", icono: BookOpen },
  { id: "modelo", etiqueta: "El modelo", icono: ChartColumn },
  { id: "historial", etiqueta: "Historial", icono: History },
];

// La pestaña activa vive en el "#hash" de la URL: así se puede compartir un enlace
// directo (p. ej. /#modelo) y el botón "atrás" del navegador funciona.
function leerHash(): PestanaId {
  const hash = window.location.hash.slice(1);
  return PESTANAS.find((p) => p.id === hash)?.id ?? "analizar";
}

function suscribirHash(alCambiar: () => void) {
  window.addEventListener("hashchange", alCambiar);
  return () => window.removeEventListener("hashchange", alCambiar);
}

export function usePestanaActiva() {
  const activa = useSyncExternalStore(suscribirHash, leerHash, () => "analizar" as const);
  const cambiar = (id: PestanaId) => {
    window.location.hash = id;
  };
  return [activa, cambiar] as const;
}

interface Props {
  activa: PestanaId;
  onCambiar: (id: PestanaId) => void;
  contadorHistorial: number;
}

export function Pestanas({ activa, onCambiar, contadorHistorial }: Props) {
  const botones = useRef<Record<string, HTMLButtonElement | null>>({});

  // Navegación con teclado entre pestañas (patrón ARIA "tabs")
  const alPresionarTecla = (e: KeyboardEvent) => {
    const i = PESTANAS.findIndex((p) => p.id === activa);
    const destino =
      e.key === "ArrowRight"
        ? PESTANAS[(i + 1) % PESTANAS.length]
        : e.key === "ArrowLeft"
          ? PESTANAS[(i - 1 + PESTANAS.length) % PESTANAS.length]
          : e.key === "Home"
            ? PESTANAS[0]
            : e.key === "End"
              ? PESTANAS[PESTANAS.length - 1]
              : null;
    if (!destino) return;
    e.preventDefault();
    onCambiar(destino.id);
    botones.current[destino.id]?.focus();
  };

  return (
    <nav className="sticky top-0 z-20 -mx-4 mb-6 px-4 py-3 sm:-mx-6 sm:px-6" aria-label="Secciones">
      {/* Fondo casi opaco: al quedar fija arriba, el contenido no debe transparentarse detrás */}
      <div className="glass no-scrollbar overflow-x-auto rounded-2xl p-1.5" style={{ background: "rgb(6 16 31 / 0.94)" }}>
        <div role="tablist" aria-label="Secciones de NeuroLens" className="flex min-w-max gap-1" onKeyDown={alPresionarTecla}>
          {PESTANAS.map(({ id, etiqueta, icono: Icono }) => {
            const seleccionada = id === activa;
            return (
              <button
                key={id}
                ref={(el) => {
                  botones.current[id] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={seleccionada}
                aria-controls={`panel-${id}`}
                tabIndex={seleccionada ? 0 : -1}
                onClick={() => onCambiar(id)}
                className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                  seleccionada ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {seleccionada && (
                  <motion.span
                    layoutId="pestana-activa"
                    className="absolute inset-0 rounded-xl border border-cyan-400/30 bg-gradient-to-b from-cyan-400/20 to-teal-400/10"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icono className={`relative h-4 w-4 ${seleccionada ? "text-cyan-300" : ""}`} aria-hidden />
                <span className="relative">{etiqueta}</span>
                {id === "historial" && contadorHistorial > 0 && (
                  <span className="relative rounded-full bg-white/10 px-1.5 text-[11px] tabular-nums text-slate-300">
                    {contadorHistorial}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
