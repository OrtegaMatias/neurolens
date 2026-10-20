import { LogOut } from "lucide-react";
import { AvisoEducativo } from "./AvisoEducativo";
import { EstadoConexion } from "./EstadoConexion";
import { InsigniaIA } from "./InsigniaIA";
import { Logo } from "./Logo";
import { LogoUDD } from "./LogoUDD";
import type { EstadoServidor } from "@/lib/useInfoServidor";

export function Encabezado({ estado, onSalir }: { estado: EstadoServidor; onSalir: () => void }) {
  return (
    <header>
      <AvisoEducativo />

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
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <LogoUDD className="hidden h-8 w-auto opacity-90 md:block" />
          <EstadoConexion estado={estado} />
          <InsigniaIA />
          <button
            type="button"
            onClick={onSalir}
            title="Salir y volver a la pantalla de inicio"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-rose-400/40 hover:text-rose-200"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
