"use client";

import { motion } from "framer-motion";
import { FlaskConical, ScanEye, TriangleAlert } from "lucide-react";
import type { Clase, Metricas, Prediccion } from "@/lib/api";
import { porcentaje } from "@/lib/formato";
import { Ayuda } from "./Ayuda";
import { BarrasProbabilidad } from "./BarrasProbabilidad";
import { NumeroAnimado } from "./NumeroAnimado";

interface Props {
  prediccion: Prediccion;
  clases: Clase[];
  metricas?: Metricas;
}

export function PanelResultado({ prediccion, clases, metricas }: Props) {
  const clase = clases.find((c) => c.id === prediccion.clase);
  const color = clase?.color ?? "#22d3ee";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Clase predicha */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">El modelo clasificó la imagen como</p>
        <h2 className="mt-1 flex items-center gap-3 font-display text-3xl font-semibold sm:text-4xl" style={{ color }}>
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 16px ${color}` }} aria-hidden />
          {prediccion.nombre}
        </h2>
        {clase?.descripcion && <p className="mt-2 text-sm text-slate-400">{clase.descripcion}</p>}
      </div>

      {/* Aviso de baja confianza: requiere revisión humana */}
      {prediccion.baja_confianza && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-amber-100">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
          <div>
            <p className="font-semibold">
              Confianza bajo el umbral ({porcentaje(prediccion.umbral, 0)}) calibrado en validación: requiere revisión
              humana
            </p>
            <p className="mt-1 text-sm text-amber-100/80">
              El modelo duda entre varias clases. Este resultado no debe tomarse en cuenta sin la evaluación de un
              especialista.
            </p>
          </div>
        </div>
      )}

      {/* Dos números distintos: confianza en ESTA imagen vs desempeño general del modelo */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
            <ScanEye className="h-3.5 w-3.5" aria-hidden />
            Confianza en esta imagen
            <Ayuda etiqueta="¿Qué es la confianza?">
              Es la probabilidad que el modelo le asigna a la clase elegida <strong>para esta imagen en particular</strong>.
              No es la probabilidad de que el resultado sea correcto: un modelo puede estar muy seguro y aun así
              equivocarse.
            </Ayuda>
          </p>
          <NumeroAnimado
            valor={prediccion.confianza}
            className={`mt-2 block font-display text-5xl font-semibold tabular-nums ${prediccion.baja_confianza ? "text-amber-300" : "text-white"}`}
          />
          <p className="mt-1 text-xs text-slate-500">Umbral de revisión: {porcentaje(prediccion.umbral, 0)}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            Desempeño del modelo en prueba
            <Ayuda etiqueta="¿Qué es el desempeño en prueba?">
              Describe al modelo <strong>en general</strong>, no a esta imagen. La <em>balanced accuracy</em> es el
              promedio del acierto (recall) de cada clase en {metricas ? metricas.n_test.toLocaleString("es-CL") : "las"}{" "}
              imágenes de prueba que el modelo nunca vio durante el entrenamiento.
            </Ayuda>
          </p>
          <p className="mt-2 font-display text-5xl font-semibold tabular-nums text-cyan-200">
            {metricas ? porcentaje(metricas.balanced_accuracy) : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Balanced accuracy{metricas ? ` · ${metricas.modelo} · ${metricas.n_test.toLocaleString("es-CL")} imágenes` : ""}
          </p>
        </div>
      </div>

      {/* Probabilidades de todas las clases */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Probabilidad por clase</p>
        <BarrasProbabilidad clases={clases} probabilidades={prediccion.probabilidades} claseGanadora={prediccion.clase} />
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        El modelo siempre elige una de sus 4 clases, incluso si la imagen no es una resonancia cerebral. Úsalo solo con
        imágenes similares a las del conjunto de entrenamiento y con fines educativos.
      </p>
    </motion.div>
  );
}
