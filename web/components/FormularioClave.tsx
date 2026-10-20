"use client";

import { useId, useState, type FormEvent } from "react";
import { useAnimate } from "framer-motion";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { ApiError, entrar } from "@/lib/api";

interface Props {
  /** se llama cuando el backend aceptó la clave (ya dejó la cookie de sesión) */
  onExito: () => void;
  /** versión pequeña para usar dentro de tarjetas o del encabezado */
  compacto?: boolean;
  autoFocus?: boolean;
  textoBoton?: string;
}

// Formulario de clave reutilizable: landing, encabezado y tarjetas de IA bloqueadas.
export function FormularioClave({ onExito, compacto = false, autoFocus = false, textoBoton = "Entrar" }: Props) {
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Referencia al formulario para animar una "sacudida" cuando la clave falla
  const [formulario, animar] = useAnimate<HTMLFormElement>();
  const id = useId();

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!clave.trim() || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await entrar(clave.trim());
      onExito();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : undefined;
      setError(
        status === 401
          ? "Clave incorrecta. Revisa que sea la clave vigente de hoy."
          : status === 429
            ? "Demasiados intentos. Espera unos minutos antes de volver a intentar."
            : err instanceof Error
              ? err.message
              : "No se pudo verificar la clave.",
      );
      void animar(formulario.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 });
    } finally {
      setEnviando(false);
    }
  };

  return (
    // @container: la versión compacta se apila si el espacio disponible es angosto (p. ej. el panel del encabezado)
    <div className="@container">
      <form
        ref={formulario}
        onSubmit={enviar}
        className={compacto ? "flex flex-col gap-2 @xs:flex-row" : "space-y-3"}
      >
        <label htmlFor={`${id}-clave`} className="sr-only">
          Clave de acceso
        </label>
        <input
          id={`${id}-clave`}
          name="clave"
          type="text"
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={32}
          placeholder="XXXX-XXXX-XXXX"
          value={clave}
          onChange={(e) => setClave(e.target.value.toUpperCase())}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full min-w-0 rounded-xl border bg-ink-900/70 text-center font-mono uppercase text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 ${
            compacto ? "px-3 py-2 text-sm tracking-[0.15em]" : "px-4 py-3.5 text-lg tracking-[0.25em]"
          } ${error ? "border-rose-400/50 focus:ring-rose-400/40" : "border-white/10 focus:border-cyan-400/50 focus:ring-cyan-400/30"}`}
        />
        <button
          type="submit"
          disabled={!clave.trim() || enviando}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            compacto
              ? "border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-400/20"
              : "w-full bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3.5 text-slate-950 shadow-[0_0_24px_-6px_rgba(34,211,238,0.7)] hover:brightness-110"
          }`}
        >
          {enviando ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : compacto ? (
            <KeyRound className="h-4 w-4" aria-hidden />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden />
          )}
          {enviando ? "Verificando…" : textoBoton}
        </button>
      </form>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={`mt-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-rose-200 ${compacto ? "text-xs" : "text-sm"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
