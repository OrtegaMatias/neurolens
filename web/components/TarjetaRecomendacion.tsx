"use client";

import { Sparkles } from "lucide-react";
import { recomendar, type Prediccion } from "@/lib/api";
import { useAccesoIA } from "@/lib/accesoIA";
import { useStreamIA } from "@/lib/useStreamIA";
import { BloqueoIA } from "./BloqueoIA";
import { ControlesIA, SalidaIA } from "./SalidaIA";

export function TarjetaRecomendacion({ prediccion }: { prediccion: Prediccion }) {
  const { ia } = useAccesoIA();
  const { estado, texto, error, generar, detener } = useStreamIA((alRecibir, signal) =>
    recomendar(
      { clase: prediccion.clase, confianza: prediccion.confianza, probabilidades: prediccion.probabilidades },
      alRecibir,
      signal,
    ),
  );

  return (
    <section className="glass rounded-2xl p-5 sm:p-6" aria-labelledby="titulo-recomendacion">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="titulo-recomendacion" className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Sparkles className="h-5 w-5 text-cyan-300" aria-hidden />
          Recomendación educativa
        </h3>
        {ia && <ControlesIA estado={estado} onGenerar={generar} onDetener={detener} />}
      </div>

      {(estado === "inicial" || !ia) && (
        <div className="mt-4">
          <p className="text-sm text-slate-400">
            Un modelo de lenguaje (Claude Haiku) redactará una explicación educativa del resultado: qué significa la clase,
            qué tan segura fue la predicción y qué pasos razonables seguir. No reemplaza a un profesional de salud.
          </p>
          {/* En modo invitado se muestra el bloqueo con la clave; al desbloquear, la predicción actual se mantiene */}
          {ia ? (
            <button
              type="button"
              onClick={generar}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3 font-semibold text-slate-950 shadow-[0_0_24px_-6px_rgba(34,211,238,0.7)] transition hover:brightness-110 sm:w-auto"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Generar recomendación con IA
            </button>
          ) : (
            <BloqueoIA />
          )}
        </div>
      )}

      {ia && <SalidaIA estado={estado} texto={texto} error={error} onReintentar={generar} />}
    </section>
  );
}
