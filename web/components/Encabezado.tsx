import { ShieldAlert } from "lucide-react";
import { Logo } from "./Logo";
import { EstadoConexion } from "./EstadoConexion";
import type { EstadoServidor } from "@/lib/useInfoServidor";

export function Encabezado({ estado }: { estado: EstadoServidor }) {
  return (
    <header>
      {/* Aviso educativo persistente: visible en todas las pestañas */}
      <div
        role="note"
        className="border-b border-amber-300/20 bg-amber-400/10 px-4 py-2 text-center text-xs font-medium text-amber-100 sm:text-sm"
      >
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <span>Prototipo educativo</span>
          <span aria-hidden className="text-amber-300/60">·</span>
          <strong className="font-semibold">No es un diagnóstico médico</strong>
          <span aria-hidden className="text-amber-300/60">·</span>
          <span>Consulta siempre a un profesional de salud</span>
        </span>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pb-2 pt-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo className="h-11 w-11 shrink-0 drop-shadow-[0_0_14px_rgba(34,211,238,0.35)] sm:h-12 sm:w-12" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Neuro<span className="text-cyan-300">Lens</span>
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Clasificador educativo de tumores cerebrales en resonancia magnética
            </p>
          </div>
        </div>
        <EstadoConexion estado={estado} />
      </div>
    </header>
  );
}
