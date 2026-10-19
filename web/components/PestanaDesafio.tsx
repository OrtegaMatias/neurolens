"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, CircleCheck, CircleX, LoaderCircle, RefreshCw, RotateCcw, Trophy, User } from "lucide-react";
import { predecir, type Clase, type ClaseId, type Metricas, type Prediccion } from "@/lib/api";
import { registrarRonda, reiniciarMarcador, useMarcador } from "@/lib/almacenamiento";
import { cargarBancoDesafio, descargarEjemplo, type Ejemplo } from "@/lib/ejemplos";
import { porcentaje } from "@/lib/formato";
import { ExplicacionDesafio } from "./ExplicacionDesafio";
import { VisorImagen } from "./VisorImagen";

interface Ronda {
  id: number;
  ejemplo: Ejemplo;
  eleccion: ClaseId | null;
  prediccion: Prediccion | null;
  errorIA: string | null;
}

interface Props {
  clases: Clase[];
  /** umbral calibrado y métricas de prueba (pueden faltar si /api/info aún no responde) */
  umbral?: number;
  metricas?: Metricas;
}

export function PestanaDesafio({ clases, umbral, metricas }: Props) {
  const [banco, setBanco] = useState<Ejemplo[] | null>(null);
  const [ronda, setRonda] = useState<Ronda | null>(null);
  const marcador = useMarcador();
  // Rondas ya sumadas al marcador (evita contar dos veces la misma)
  const registradas = useRef(new Set<number>());

  // La IA analiza la imagen apenas aparece, pero el resultado se oculta hasta que el humano responde
  const consultarIA = useCallback(async (id: number, ejemplo: Ejemplo) => {
    try {
      const blob = await descargarEjemplo(ejemplo.src);
      const prediccion = await predecir(blob, ejemplo.src.split("/").pop() ?? "desafio.jpg");
      setRonda((r) => (r?.id === id ? { ...r, prediccion, errorIA: null } : r));
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "La IA no pudo analizar la imagen.";
      setRonda((r) => (r?.id === id ? { ...r, errorIA: mensaje } : r));
    }
  }, []);

  const nuevaRonda = useCallback(
    (bancoActual: Ejemplo[], anterior?: Ejemplo) => {
      // Elegimos una imagen al azar distinta a la anterior
      const opciones = bancoActual.length > 1 ? bancoActual.filter((e) => e.src !== anterior?.src) : bancoActual;
      const ejemplo = opciones[Math.floor(Math.random() * opciones.length)];
      const id = Date.now();
      setRonda({ id, ejemplo, eleccion: null, prediccion: null, errorIA: null });
      void consultarIA(id, ejemplo);
    },
    [consultarIA],
  );

  useEffect(() => {
    let cancelado = false;
    cargarBancoDesafio().then((b) => {
      if (cancelado) return;
      setBanco(b);
      nuevaRonda(b);
    });
    return () => {
      cancelado = true;
    };
  }, [nuevaRonda]);

  // Cuando hay respuesta humana Y predicción de la IA, se suma la ronda al marcador
  useEffect(() => {
    if (!ronda?.eleccion || !ronda.prediccion || registradas.current.has(ronda.id)) return;
    registradas.current.add(ronda.id);
    registrarRonda(ronda.eleccion === ronda.ejemplo.clase, ronda.prediccion.clase === ronda.ejemplo.clase);
  }, [ronda]);

  const revelado = Boolean(ronda?.eleccion && ronda.prediccion);

  return (
    <div className="space-y-6">
      <Marcador humano={marcador.humano} ia={marcador.ia} rondas={marcador.rondas} />

      {!ronda ? (
        <div className="glass flex items-center justify-center gap-3 rounded-3xl p-10 text-slate-400">
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> Preparando el desafío…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <section className="glass rounded-3xl p-5 sm:p-6" aria-label="Imagen del desafío">
            <VisorImagen
              key={ronda.id}
              src={ronda.ejemplo.src}
              alt="Resonancia magnética del desafío"
              analizando={Boolean(ronda.eleccion) && !ronda.prediccion && !ronda.errorIA}
              gradcam={revelado ? ronda.prediccion?.gradcam : undefined}
            />
          </section>

          <section className="glass rounded-3xl p-5 sm:p-6" aria-live="polite">
            <h2 className="font-display text-xl font-semibold text-white">¿Qué ves en esta resonancia?</h2>
            <p className="mt-1 text-sm text-slate-400">
              Elige una clase y compárate con el modelo. ¿No sabes por dónde partir? Revisa la pestaña{" "}
              <span className="text-cyan-300">Aprende</span>.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {clases.map((c) => {
                const elegida = ronda.eleccion === c.id;
                const correcta = revelado && c.id === ronda.ejemplo.clase;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={Boolean(ronda.eleccion)}
                    onClick={() => setRonda((r) => (r ? { ...r, eleccion: c.id } : r))}
                    className={`relative flex items-center gap-2 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition disabled:cursor-default ${
                      elegida ? "text-white" : "text-slate-200"
                    } ${!ronda.eleccion ? "hover:-translate-y-0.5 hover:bg-white/10" : ""} ${
                      correcta ? "ring-2 ring-emerald-400/70" : ""
                    }`}
                    style={{
                      borderColor: elegida ? c.color : "rgb(255 255 255 / 0.1)",
                      backgroundColor: elegida ? `${c.color}26` : "rgb(255 255 255 / 0.04)",
                    }}
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
                    {c.nombre}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {ronda.eleccion && !revelado && (
                <motion.div
                  key="esperando"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300"
                >
                  {ronda.errorIA ? (
                    <div role="alert" className="space-y-3">
                      <p className="text-rose-200">{ronda.errorIA}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setRonda((r) => (r ? { ...r, errorIA: null } : r));
                          void consultarIA(ronda.id, ronda.ejemplo);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-100"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden /> Reintentar con la IA
                      </button>
                    </div>
                  ) : (
                    <p className="flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" aria-hidden />
                      La IA está pensando… (si el servidor estaba dormido puede tardar ~30 s)
                    </p>
                  )}
                </motion.div>
              )}

              {revelado && ronda.eleccion && ronda.prediccion && (
                <motion.div
                  key="revelado"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-3"
                >
                  <Veredicto
                    humanoAcierta={ronda.eleccion === ronda.ejemplo.clase}
                    iaAcierta={ronda.prediccion.clase === ronda.ejemplo.clase}
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Respuesta
                      icono={<User className="h-4 w-4" aria-hidden />}
                      titulo="Tú dijiste"
                      valor={clases.find((c) => c.id === ronda.eleccion)?.nombre ?? ronda.eleccion}
                      acierto={ronda.eleccion === ronda.ejemplo.clase}
                    />
                    <Respuesta
                      icono={<Bot className="h-4 w-4" aria-hidden />}
                      titulo="La IA dijo"
                      valor={`${ronda.prediccion.nombre} · ${porcentaje(ronda.prediccion.confianza, 0)}`}
                      acierto={ronda.prediccion.clase === ronda.ejemplo.clase}
                    />
                    <Respuesta
                      titulo="Etiqueta real"
                      valor={clases.find((c) => c.id === ronda.ejemplo.clase)?.nombre ?? ronda.ejemplo.clase}
                    />
                  </div>
                  <ExplicacionDesafio
                    key={ronda.id}
                    claseReal={ronda.ejemplo.clase}
                    eleccion={ronda.eleccion}
                    prediccion={ronda.prediccion}
                    clases={clases}
                    umbral={umbral}
                    metricas={metricas}
                  />
                  <button
                    type="button"
                    onClick={() => banco && nuevaRonda(banco, ronda.ejemplo)}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3 font-semibold text-slate-950 transition hover:brightness-110 sm:w-auto"
                  >
                    Siguiente <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-6 text-xs leading-relaxed text-slate-500">
              Juego educativo: muestra cómo se compara el modelo con una persona sin formación médica. Un especialista
              en radiología se forma durante años y considera mucha más información que una sola imagen.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function Marcador({ humano, ia, rondas }: { humano: number; ia: number; rondas: number }) {
  return (
    <section className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="Marcador">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-amber-300" aria-hidden />
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Humano vs IA</h2>
          <p className="text-xs text-slate-400">{rondas === 1 ? "1 ronda jugada" : `${rondas} rondas jugadas`} · se guarda en este navegador</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Puntaje etiqueta="Humano" valor={humano} rondas={rondas} icono={<User className="h-4 w-4" aria-hidden />} />
        <span className="font-display text-slate-500">vs</span>
        <Puntaje etiqueta="IA" valor={ia} rondas={rondas} icono={<Bot className="h-4 w-4" aria-hidden />} />
        <button
          type="button"
          onClick={reiniciarMarcador}
          disabled={rondas === 0}
          title="Reiniciar marcador"
          aria-label="Reiniciar marcador"
          className="ml-1 rounded-xl border border-white/10 p-2 text-slate-400 transition hover:text-white disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

function Puntaje({ etiqueta, valor, rondas, icono }: { etiqueta: string; valor: number; rondas: number; icono: ReactNode }) {
  return (
    <div className="min-w-24 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-center">
      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        {icono} {etiqueta}
      </p>
      <motion.p
        key={valor}
        initial={{ scale: 1.3, color: "#67e8f9" }}
        animate={{ scale: 1, color: "#ffffff" }}
        className="font-display text-2xl font-semibold tabular-nums"
      >
        {valor}
      </motion.p>
      {rondas > 0 && <p className="text-[11px] text-slate-500">{Math.round((valor / rondas) * 100)}% aciertos</p>}
    </div>
  );
}

function Veredicto({ humanoAcierta, iaAcierta }: { humanoAcierta: boolean; iaAcierta: boolean }) {
  const texto =
    humanoAcierta && iaAcierta
      ? "¡Empate! Ambos acertaron."
      : humanoAcierta
        ? "¡Le ganaste a la IA en esta ronda!"
        : iaAcierta
          ? "Esta vez ganó la IA."
          : "Ninguno acertó: esta imagen era difícil.";
  return <p className="font-display text-lg font-semibold text-white">{texto}</p>;
}

function Respuesta({
  titulo,
  valor,
  acierto,
  icono,
}: {
  titulo: string;
  valor: string;
  acierto?: boolean;
  icono?: ReactNode;
}) {
  const borde = acierto === undefined ? "border-cyan-400/30" : acierto ? "border-emerald-400/40" : "border-rose-400/40";
  return (
    <div className={`rounded-2xl border bg-white/[0.03] p-3 ${borde}`}>
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        {icono}
        {titulo}
        {acierto === true && <CircleCheck className="ml-auto h-4 w-4 text-emerald-400" aria-label="Correcto" />}
        {acierto === false && <CircleX className="ml-auto h-4 w-4 text-rose-400" aria-label="Incorrecto" />}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-100">{valor}</p>
    </div>
  );
}
