import type { EstadoServidor } from "@/lib/useInfoServidor";

const ETIQUETAS: Record<EstadoServidor, { texto: string; color: string; pulso: boolean }> = {
  conectando: { texto: "Conectando…", color: "bg-sky-400", pulso: true },
  despertando: { texto: "Despertando servidor…", color: "bg-amber-400", pulso: true },
  listo: { texto: "Modelo en línea", color: "bg-emerald-400", pulso: false },
  caido: { texto: "Servidor no disponible", color: "bg-rose-400", pulso: false },
};

// Pequeño indicador del estado del backend en el encabezado
export function EstadoConexion({ estado }: { estado: EstadoServidor }) {
  const { texto, color, pulso } = ETIQUETAS[estado];
  return (
    <span
      className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 sm:inline-flex"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2">
        {pulso && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${color}`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
      </span>
      {texto}
    </span>
  );
}
