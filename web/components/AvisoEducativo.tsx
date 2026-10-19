import { ShieldAlert } from "lucide-react";

// Aviso educativo persistente: visible en la pantalla de acceso y en todas las pestañas
export function AvisoEducativo() {
  return (
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
  );
}
