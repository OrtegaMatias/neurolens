"use client";

import type { ReactNode } from "react";
import { Bot, Flame, Lightbulb, Sparkles, TriangleAlert, User } from "lucide-react";
import { explicarDesafio, type Clase, type ClaseId, type Metricas, type Prediccion } from "@/lib/api";
import { porcentaje } from "@/lib/formato";
import { diferencia, RASGOS } from "@/lib/pistas";
import { useStreamIA } from "@/lib/useStreamIA";
import { ControlesIA, SalidaIA } from "./SalidaIA";

interface Props {
  claseReal: ClaseId;
  eleccion: ClaseId;
  prediccion: Prediccion;
  clases: Clase[];
  /** umbral calibrado de /api/info; si falta se usa el que viene en la predicción */
  umbral?: number;
  /** métricas de prueba; si faltan se omite la estadística de confusiones */
  metricas?: Metricas;
}

// Explica, tras revelar la ronda, por qué la persona y/o la IA se equivocaron.
// Las pistas son instantáneas (estáticas + datos del modelo); la explicación con Claude es opcional.
export function ExplicacionDesafio({ claseReal, eleccion, prediccion, clases, umbral, metricas }: Props) {
  const nombre = (id: string) => clases.find((c) => c.id === id)?.nombre ?? id;
  const { estado, texto, error, generar, detener } = useStreamIA((alRecibir, signal) =>
    explicarDesafio(
      {
        clase_real: claseReal,
        eleccion,
        prediccion: prediccion.clase,
        confianza: prediccion.confianza,
        probabilidades: prediccion.probabilidades,
      },
      alRecibir,
      signal,
    ),
  );

  const humanoAcierta = eleccion === claseReal;
  const iaAcierta = prediccion.clase === claseReal;
  const umbralRevision = umbral ?? prediccion.umbral;
  const bajoUmbral = prediccion.confianza < umbralRevision;
  const consejo = diferencia(eleccion, claseReal);

  // Las 2 clases más probables según el modelo
  const top2 = Object.entries(prediccion.probabilidades)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  // ¿Cuántas veces en prueba el modelo confundió esta clase real con la predicha? (filas = real, columnas = predicha)
  const iReal = clases.findIndex((c) => c.id === claseReal);
  const iPred = clases.findIndex((c) => c.id === prediccion.clase);
  const filaReal = metricas?.matriz_confusion[iReal];
  const confusionPrueba =
    filaReal && iPred >= 0 && filaReal[iPred] !== undefined
      ? { veces: filaReal[iPred], total: filaReal.reduce((a, b) => a + b, 0) }
      : null;

  const falsoNegativo = !iaAcierta && prediccion.clase === "notumor";

  return (
    <div className="space-y-3">
      {/* En pantallas lg la columna derecha es angosta: ahí van apiladas */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {/* Tarjeta de la persona */}
        <Tarjeta icono={<User className="h-4 w-4" aria-hidden />} titulo="Tu respuesta" acierto={humanoAcierta}>
          {humanoAcierta ? (
            <p>
              ¡Bien! Rasgo clave de {nombre(claseReal)}: {RASGOS[claseReal].clave}
            </p>
          ) : (
            <>
              <p>
                Elegiste <strong className="text-white">{nombre(eleccion)}</strong>, pero era{" "}
                <strong className="text-white">{nombre(claseReal)}</strong>.
              </p>
              {consejo && (
                <p className="flex gap-2 rounded-xl bg-white/[0.04] p-2.5 text-slate-200">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
                  <span>{consejo}</span>
                </p>
              )}
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Qué buscar en {nombre(claseReal)}
              </p>
              <ul className="list-disc space-y-1 pl-5 marker:text-cyan-300">
                {RASGOS[claseReal].buscar.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </Tarjeta>

        {/* Tarjeta de la IA */}
        <Tarjeta icono={<Bot className="h-4 w-4" aria-hidden />} titulo="La IA" acierto={iaAcierta}>
          {iaAcierta ? (
            <p>
              Acertó con {porcentaje(prediccion.confianza)} de confianza, {bajoUmbral ? "bajo" : "sobre"} el umbral de
              revisión ({porcentaje(umbralRevision, 0)})
              {bajoUmbral ? ": acertó, pero dudando; en un caso real igual pediría revisión humana." : "."}
            </p>
          ) : (
            <>
              {falsoNegativo && (
                <p className="flex gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-2.5 text-amber-100">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
                  <span>
                    <strong>Falso negativo:</strong> había un tumor y la IA dijo &quot;Sin tumor&quot;. Es el error más
                    costoso, porque podría retrasar un estudio necesario.
                  </span>
                </p>
              )}
              <p>
                Dijo <strong className="text-white">{prediccion.nombre}</strong> con{" "}
                {porcentaje(prediccion.confianza)} de confianza:{" "}
                {bajoUmbral ? (
                  <>
                    <strong className="text-amber-200">dudó</strong> (bajo el umbral de {porcentaje(umbralRevision, 0)}),
                    así que la app habría pedido revisión humana.
                  </>
                ) : (
                  <>
                    <strong className="text-rose-200">se equivocó con seguridad</strong> (sobre el umbral de{" "}
                    {porcentaje(umbralRevision, 0)}): el error más peligroso, porque no dispara la revisión humana.
                  </>
                )}
              </p>

              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Sus 2 opciones principales</p>
                {top2.map(([id, p]) => {
                  const color = clases.find((c) => c.id === id)?.color ?? "#22d3ee";
                  return (
                    <div key={id} className="flex items-center gap-2 text-xs">
                      <span className="w-28 shrink-0 truncate text-slate-300">{nombre(id)}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full" style={{ width: `${p * 100}%`, backgroundColor: color }} />
                      </div>
                      <span className="w-12 text-right font-mono tabular-nums text-slate-300">{porcentaje(p)}</span>
                    </div>
                  );
                })}
              </div>

              {confusionPrueba && (
                <p>
                  En prueba confundió {nombre(claseReal)} con {nombre(prediccion.clase)}{" "}
                  <strong className="text-white">
                    {confusionPrueba.veces} de {confusionPrueba.total.toLocaleString("es-CL")}
                  </strong>{" "}
                  veces
                  {confusionPrueba.total > 0 && ` (${porcentaje(confusionPrueba.veces / confusionPrueba.total)})`}.
                </p>
              )}

              <p className="flex gap-2 text-slate-400">
                <Flame className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" aria-hidden />
                <span>
                  Activa <strong className="text-slate-200">Grad-CAM</strong> en la imagen: si el calor no cae sobre la
                  lesión, la red miró la zona equivocada.
                </span>
              </p>
            </>
          )}
        </Tarjeta>
      </div>

      {/* Explicación opcional con Claude */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {estado === "inicial" ? (
            <button
              type="button"
              onClick={generar}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Explícame con IA (Claude)
            </button>
          ) : (
            <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden />
              Explicación con IA
            </p>
          )}
          <ControlesIA estado={estado} onGenerar={generar} onDetener={detener} />
        </div>
        <SalidaIA estado={estado} texto={texto} error={error} onReintentar={generar} />
      </div>
    </div>
  );
}

function Tarjeta({
  icono,
  titulo,
  acierto,
  children,
}: {
  icono: ReactNode;
  titulo: string;
  acierto: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`space-y-2.5 rounded-2xl border bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-300 ${
        acierto ? "border-emerald-400/30" : "border-rose-400/30"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
        {icono}
        {titulo}
        <span className={`ml-auto normal-case tracking-normal ${acierto ? "text-emerald-300" : "text-rose-300"}`}>
          {acierto ? "Correcto" : "Incorrecto"}
        </span>
      </p>
      {children}
    </div>
  );
}
