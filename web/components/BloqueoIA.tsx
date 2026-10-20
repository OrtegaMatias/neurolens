"use client";

import { Lock } from "lucide-react";
import { useAccesoIA } from "@/lib/accesoIA";
import { FormularioClave } from "./FormularioClave";

// Estado "bloqueado" de las funciones de IA generativa en modo invitado.
// Al desbloquear solo cambia el contexto: la predicción o ronda actual se mantiene.
export function BloqueoIA() {
  const { avisoIA, activarIA } = useAccesoIA();
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-ink-900/50 p-4">
      <p className={`mb-3 flex items-center gap-2 text-sm ${avisoIA ? "text-amber-200" : "text-slate-300"}`}>
        <Lock className="h-4 w-4 shrink-0" aria-hidden />
        {avisoIA ?? "La IA generativa requiere la clave de acceso."}
      </p>
      <FormularioClave compacto textoBoton="Desbloquear" onExito={activarIA} />
    </div>
  );
}
