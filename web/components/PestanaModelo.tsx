"use client";

import type { ReactNode } from "react";
import { Activity, ChartColumn, Gauge, Grid3x3, LoaderCircle, Scale, SlidersHorizontal, TriangleAlert } from "lucide-react";
import type { Clase, Info } from "@/lib/api";
import { porcentaje } from "@/lib/formato";
import { Ayuda } from "./Ayuda";
import { ComparacionModelos } from "./ComparacionModelos";
import { MatrizConfusion } from "./MatrizConfusion";

export function PestanaModelo({ info, clases }: { info: Info | null; clases: Clase[] }) {
  if (!info) {
    return (
      <div className="glass flex items-center justify-center gap-3 rounded-3xl p-10 text-center text-slate-400">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
        Las métricas se cargan desde el servidor del modelo…
      </div>
    );
  }

  const { metricas, umbral } = info;
  const m = metricas.matriz_confusion;

  // Error más costoso: imágenes CON tumor que el modelo clasificó como "Sin tumor" (falsos negativos)
  const idxSinTumor = clases.findIndex((c) => c.id === "notumor");
  let falsosNegativos = 0;
  let totalConTumor = 0;
  let falsosPositivos = 0;
  m.forEach((fila, i) => {
    if (i === idxSinTumor) {
      falsosPositivos = fila.reduce((a, b, j) => (j === idxSinTumor ? a : a + b), 0);
      return;
    }
    totalConTumor += fila.reduce((a, b) => a + b, 0);
    falsosNegativos += idxSinTumor >= 0 ? (fila[idxSinTumor] ?? 0) : 0;
  });

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Métricas en el conjunto de prueba">
        <Metrica
          icono={<Activity className="h-4 w-4" aria-hidden />}
          titulo="Accuracy"
          valor={porcentaje(metricas.accuracy)}
          ayuda="Porcentaje de imágenes de prueba clasificadas correctamente. Puede engañar si unas clases tienen muchas más imágenes que otras."
        />
        <Metrica
          icono={<Scale className="h-4 w-4" aria-hidden />}
          titulo="Balanced accuracy"
          valor={porcentaje(metricas.balanced_accuracy)}
          destacado
          ayuda="Promedio del recall de cada clase: le da el mismo peso a todas, aunque tengan distinta cantidad de imágenes. Es la métrica principal del proyecto."
        />
        <Metrica
          icono={<Grid3x3 className="h-4 w-4" aria-hidden />}
          titulo="Imágenes de prueba"
          valor={metricas.n_test.toLocaleString("es-CL")}
          ayuda="Imágenes que el modelo nunca vio durante el entrenamiento ni la calibración. Se usan solo para medir el desempeño final."
        />
        <Metrica
          icono={<SlidersHorizontal className="h-4 w-4" aria-hidden />}
          titulo="Umbral de revisión"
          valor={porcentaje(umbral, 0)}
          ayuda="Si la confianza de una predicción es menor a este valor, la app pide revisión humana. Se calibró con el conjunto de validación."
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recall y precisión por clase */}
        <section className="glass rounded-3xl p-5 sm:p-6">
          <Titulo icono={<Gauge className="h-5 w-5 text-cyan-300" aria-hidden />}>Desempeño por clase</Titulo>
          <p className="mt-1 text-sm text-slate-400">
            <strong className="font-medium text-slate-300">Recall:</strong> de las imágenes que realmente son de esa
            clase, ¿cuántas detectó? <strong className="font-medium text-slate-300">Precisión:</strong> cuando el
            modelo dice esa clase, ¿cuántas veces acierta?
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-2 font-medium">Clase</th>
                  <th className="pb-2 font-medium">Recall</th>
                  <th className="pb-2 font-medium">Precisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clases.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2 text-slate-200">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
                        {c.nombre}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <BarraCelda valor={metricas.recall_por_clase[c.id] ?? 0} color={c.color} />
                    </td>
                    <td className="py-2.5">
                      <BarraCelda valor={metricas.precision_por_clase[c.id] ?? 0} color={c.color} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Comparación de modelos */}
        <section className="glass rounded-3xl p-5 sm:p-6">
          <Titulo icono={<ChartColumn className="h-5 w-5 text-cyan-300" aria-hidden />}>Comparación de modelos</Titulo>
          <p className="mb-5 mt-1 text-sm text-slate-400">
            Balanced accuracy en el mismo conjunto de prueba para cada enfoque probado. La app usa{" "}
            <span className="text-cyan-200">{metricas.modelo}</span>.
          </p>
          <ComparacionModelos comparacion={metricas.comparacion} modeloElegido={metricas.modelo} />
        </section>
      </div>

      {/* Matriz de confusión */}
      <section className="glass rounded-3xl p-5 sm:p-6">
        <Titulo icono={<Grid3x3 className="h-5 w-5 text-cyan-300" aria-hidden />}>Matriz de confusión</Titulo>
        <p className="mb-5 mt-1 text-sm text-slate-400">
          Cada fila es la clase real y cada columna lo que predijo el modelo. La diagonal son aciertos; todo lo demás son
          confusiones. El porcentaje es respecto del total de la fila.
        </p>
        <MatrizConfusion clases={clases} matriz={m} />
      </section>

      {/* Error más costoso */}
      <section className="rounded-3xl border border-amber-400/30 bg-amber-400/[0.07] p-5 sm:p-6">
        <Titulo icono={<TriangleAlert className="h-5 w-5 text-amber-300" aria-hidden />}>El error más costoso</Titulo>
        <div className="mt-3 grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
          <div className="rounded-2xl border border-amber-300/30 bg-black/20 px-6 py-4 text-center">
            <p className="font-display text-4xl font-semibold tabular-nums text-amber-200">{falsosNegativos}</p>
            <p className="mt-1 text-xs text-amber-100/80">
              de {totalConTumor.toLocaleString("es-CL")} imágenes con tumor
              {totalConTumor > 0 && ` (${porcentaje(falsosNegativos / totalConTumor)})`}
            </p>
          </div>
          <div className="space-y-2 text-sm leading-relaxed text-amber-50/90">
            <p>
              Un <strong>falso negativo</strong> ocurre cuando una imagen con tumor (glioma, meningioma o pituitario) se
              clasifica como <strong>&quot;Sin tumor&quot;</strong>. Es el error más grave: en un contexto real podría
              retrasar un estudio o tratamiento necesario.
            </p>
            <p className="text-amber-100/70">
              El error contrario (una imagen sana marcada como tumor, falso positivo) ocurrió{" "}
              {falsosPositivos.toLocaleString("es-CL")} {falsosPositivos === 1 ? "vez" : "veces"}: también importa,
              pero normalmente se corrige con más exámenes. Por esto el recall de las clases con tumor y el umbral de
              revisión humana son claves en este proyecto.
            </p>
          </div>
        </div>
      </section>

      {/* Umbral calibrado */}
      <section className="glass rounded-3xl p-5 sm:p-6">
        <Titulo icono={<SlidersHorizontal className="h-5 w-5 text-cyan-300" aria-hidden />}>
          Umbral de confianza calibrado: {porcentaje(umbral, 0)}
        </Titulo>
        <div className="mt-4">
          <div className="relative h-3 rounded-full bg-gradient-to-r from-amber-500/60 via-amber-400/30 to-emerald-400/60">
            <span
              className="absolute top-1/2 h-6 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_white]"
              style={{ left: `${umbral * 100}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>0% · requiere revisión humana</span>
            <span>100% · confianza alta</span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Cuando la probabilidad de la clase elegida es menor a {porcentaje(umbral, 0)}, la app muestra un aviso de
          revisión humana. El valor se eligió con el conjunto de <strong className="text-slate-300">validación</strong>{" "}
          (no con el de prueba), para que las métricas de prueba sigan siendo una evaluación honesta.
        </p>
      </section>
    </div>
  );
}

function Titulo({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
      {icono}
      {children}
    </h2>
  );
}

function Metrica({
  icono,
  titulo,
  valor,
  ayuda,
  destacado = false,
}: {
  icono: ReactNode;
  titulo: string;
  valor: string;
  ayuda: string;
  destacado?: boolean;
}) {
  return (
    <div className={`glass rounded-2xl p-4 ${destacado ? "ring-1 ring-cyan-400/40" : ""}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {icono}
        <span className="truncate">{titulo}</span>
        <Ayuda etiqueta={`¿Qué es ${titulo}?`}>{ayuda}</Ayuda>
      </p>
      <p className={`mt-2 font-display text-3xl font-semibold tabular-nums ${destacado ? "text-cyan-200" : "text-white"}`}>
        {valor}
      </p>
    </div>
  );
}

function BarraCelda({ valor, color }: { valor: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5 sm:w-24">
        <div className="h-full rounded-full" style={{ width: `${valor * 100}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-slate-300">{porcentaje(valor)}</span>
    </div>
  );
}
