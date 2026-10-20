"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, KeyRound, Sparkles, Swords, UserRound } from "lucide-react";
import { FormularioClave } from "./FormularioClave";
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
  /** entrar sin clave: toda la app excepto la IA generativa */
  onInvitado: () => void;
  /** la clave fue aceptada (cookie de sesión creada): app con IA generativa */
  onConClave: () => void;
}

export function Landing({ onInvitado, onConClave }: Props) {
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
            <h2 id="titulo-acceso" className="font-display text-xl font-semibold text-white">
              ¿Cómo quieres entrar?
            </h2>

            {/* Opción 1: invitado */}
            <div className="mt-5">
              <button
                type="button"
                onClick={onInvitado}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3.5 font-semibold text-slate-950 shadow-[0_0_24px_-6px_rgba(34,211,238,0.7)] transition hover:brightness-110"
              >
                <UserRound className="h-4 w-4" aria-hidden />
                Entrar como invitado
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <p className="mt-2 text-center text-sm text-slate-400">Clasifica, mira el Grad-CAM y juega contra la IA.</p>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500" aria-hidden>
              <span className="h-px flex-1 bg-white/10" />o<span className="h-px flex-1 bg-white/10" />
            </div>

            {/* Opción 2: con clave */}
            <div>
              <h3 className="flex items-center gap-2 font-medium text-slate-100">
                <KeyRound className="h-4 w-4 text-cyan-300" aria-hidden />
                Entrar con clave · IA generativa
              </h3>
              <p className="mb-3 mt-1 text-sm leading-relaxed text-slate-400">
                Desbloquea las recomendaciones y explicaciones de Claude Haiku. La clave la entrega el equipo del
                proyecto (rota diariamente).
              </p>
              <FormularioClave onExito={onConClave} textoBoton="Entrar con clave" />
            </div>
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
