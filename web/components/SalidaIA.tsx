"use client";

import ReactMarkdown from "react-markdown";
import { Bot, RefreshCw, Square } from "lucide-react";
import type { EstadoStreamIA } from "@/lib/useStreamIA";

interface Props {
  estado: EstadoStreamIA;
  texto: string;
  error: string | null;
  onReintentar: () => void;
}

// Caja con el markdown generado por Claude (etiquetado como IA) y el aviso de error con reintento.
export function SalidaIA({ estado, texto, error, onReintentar }: Props) {
  return (
    <>
      {(estado === "generando" || estado === "listo" || (estado === "error" && texto)) && (
        <div className="mt-4 rounded-xl border border-cyan-400/15 bg-ink-900/60 p-4">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-cyan-200">
            <Bot className="h-3.5 w-3.5" aria-hidden />
            Generado por IA (Claude Haiku) · educativo
          </p>
          <div
            className={`markdown text-sm sm:text-[15px] ${estado === "generando" ? "stream-caret" : ""}`}
            aria-live="polite"
            aria-busy={estado === "generando"}
          >
            {texto ? <ReactMarkdown>{texto}</ReactMarkdown> : <p className="text-slate-500">Pensando…</p>}
          </div>
          {estado === "listo" && (
            <p className="mt-4 border-t border-white/5 pt-3 text-xs text-slate-500">
              Texto generado automáticamente: puede contener errores. Verifica la información con fuentes confiables y
              un profesional de salud.
            </p>
          )}
        </div>
      )}

      {estado === "error" && error && (
        <div role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          <p>{error}</p>
          <button
            type="button"
            onClick={onReintentar}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-300/30 px-3 py-1.5 text-rose-100 transition hover:bg-rose-400/10"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Reintentar
          </button>
        </div>
      )}
    </>
  );
}

// Botón "Detener" mientras se genera; "Generar de nuevo" cuando ya terminó.
export function ControlesIA({
  estado,
  onGenerar,
  onDetener,
}: {
  estado: EstadoStreamIA;
  onGenerar: () => void;
  onDetener: () => void;
}) {
  if (estado === "inicial") return null;
  const generando = estado === "generando";
  return (
    <button
      type="button"
      onClick={generando ? onDetener : onGenerar}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:text-white"
    >
      {generando ? <Square className="h-3.5 w-3.5" aria-hidden /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden />}
      {generando ? "Detener" : "Generar de nuevo"}
    </button>
  );
}