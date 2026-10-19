"use client";

import { useState, type FormEvent } from "react";
import { motion, useAnimate } from "framer-motion";
import { ArrowRight, Flame, KeyRound, LoaderCircle, Sparkles, Swords, TriangleAlert } from "lucide-react";
import { ApiError, entrar } from "@/lib/api";
import { AvisoEducativo } from "./AvisoEducativo";
import { Logo } from "./Logo";
import { LogoUDD } from "./LogoUDD";
import { PiePagina } from "./PiePagina";

const FUNCIONES = [
  {
    icono: Flame,
    titulo: "Clasifica y muestra dónde miró",
    texto: "Una red YOLO-cls nano estima la probabilidad de 4 clases y el Grad-CAM colorea las zonas que más influyeron.",
  },
  {
    icono: Sparkles,
    titulo: "La IA generativa lo explica",
    texto: "Claude Haiku (Anthropic) redacta una explicación educativa en lenguaje simple, siempre con aviso de revisión humana.",
  },
  {
    icono: Swords,
    titulo: "Juego: humano vs IA",
    texto: "Intenta reconocer cada resonancia antes que el modelo y aprende de tus errores (y de los suyos).",
  },
];

// Animación de entrada escalonada
const aparecer = {
  oculto: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }),
};

interface Props {
  /** aviso a mostrar al llegar (p. ej. sesión expirada) */
  mensaje?: string;
  onEntrar: () => void;
}

export function Landing({ mensaje, onEntrar }: Props) {
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Referencia al formulario para animar una "sacudida" cuando la clave falla
  const [formulario, animar] = useAnimate<HTMLFormElement>();

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!clave.trim() || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await entrar(clave.trim());
      onEntrar();
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
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AvisoEducativo />

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:py-16">
        {/* Presentación */}
        <section>
          <motion.div custom={0} variants={aparecer} initial="oculto" animate="visible" className="mb-8">
            <LogoUDD className="h-10 w-auto sm:h-12" />
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              IA para la Gestión Industrial · Certamen 1
            </p>
          </motion.div>
          <motion.div custom={0} variants={aparecer} initial="oculto" animate="visible" className="flex items-center gap-4">
            <LogoAnimado />
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Neuro<span className="text-cyan-300">Lens</span>
              </h1>
              <p className="mt-1 text-sm text-slate-400 sm:text-base">
                Clasificador educativo de tumores cerebrales en resonancia magnética
              </p>
            </div>
          </motion.div>

          <motion.p
            custom={1}
            variants={aparecer}
            initial="oculto"
            animate="visible"
            className="mt-8 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            Sube una resonancia magnética cerebral y descubre cómo un modelo de visión por computador la clasifica en{" "}
            <span className="text-white">glioma, meningioma, tumor pituitario o sin tumor</span>, qué tan seguro está y
            por qué.
          </motion.p>

          <ul className="mt-8 space-y-4">
            {FUNCIONES.map(({ icono: Icono, titulo, texto }, i) => (
              <motion.li
                key={titulo}
                custom={i + 2}
                variants={aparecer}
                initial="oculto"
                animate="visible"
                className="flex gap-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/25">
                  <Icono className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-slate-100">{titulo}</p>
                  <p className="text-sm text-slate-400">{texto}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* Formulario de acceso */}
        <motion.section
          custom={3}
          variants={aparecer}
          initial="oculto"
          animate="visible"
          aria-labelledby="titulo-acceso"
          className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8"
        >
          {/* Línea de escaneo decorativa que recorre la tarjeta */}
          <motion.span
            aria-hidden
            className="scan-line pointer-events-none absolute inset-x-0 h-16 opacity-25"
            initial={{ top: "-20%" }}
            animate={{ top: ["-20%", "110%"] }}
            transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
          />

          <div className="relative">
            <h2 id="titulo-acceso" className="flex items-center gap-2 font-display text-xl font-semibold text-white">
              <KeyRound className="h-5 w-5 text-cyan-300" aria-hidden />
              Acceso
            </h2>
            <p className="mt-1 text-sm text-slate-400">Ingresa la clave de acceso para usar la aplicación.</p>

            {mensaje && !error && (
              <p role="status" className="mt-4 flex gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
                {mensaje}
              </p>
            )}

            <form ref={formulario} onSubmit={enviar} className="mt-5 space-y-3">
              <label htmlFor="clave" className="sr-only">
                Clave de acceso
              </label>
              <input
                id="clave"
                name="clave"
                type="text"
                // Único campo de la pantalla: enfocarlo de inmediato ahorra un clic
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={32}
                placeholder="XXXX-XXXX-XXXX"
                value={clave}
                onChange={(e) => setClave(e.target.value.toUpperCase())}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "error-clave" : "nota-clave"}
                className={`w-full rounded-xl border bg-ink-900/70 px-4 py-3.5 text-center font-mono text-lg uppercase tracking-[0.25em] text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 ${
                  error ? "border-rose-400/50 focus:ring-rose-400/40" : "border-white/10 focus:border-cyan-400/50 focus:ring-cyan-400/30"
                }`}
              />
              <button
                type="submit"
                disabled={!clave.trim() || enviando}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3.5 font-semibold text-slate-950 shadow-[0_0_24px_-6px_rgba(34,211,238,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden />
                )}
                {enviando ? "Verificando…" : "Entrar"}
              </button>
            </form>

            {error && (
              <p id="error-clave" role="alert" className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            <p id="nota-clave" className="mt-5 text-xs leading-relaxed text-slate-500">
              La clave de acceso la entrega el equipo del proyecto (rota diariamente).
            </p>
          </div>
        </motion.section>
      </main>

      <PiePagina />
    </div>
  );
}

// Logo con un anillo que "pulsa", como un radar
function LogoAnimado() {
  return (
    <span className="relative flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full border border-cyan-400/40"
        animate={{ scale: [0.85, 1.25], opacity: [0.6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
      />
      <Logo className="h-14 w-14 drop-shadow-[0_0_18px_rgba(34,211,238,0.45)] sm:h-16 sm:w-16" />
    </span>
  );
}
