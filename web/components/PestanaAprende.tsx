"use client";

import { motion } from "framer-motion";
import { BookOpen, Eye, Lightbulb, Magnet, ShieldAlert } from "lucide-react";
import type { Clase } from "@/lib/api";
import { CONTENIDO_EDUCATIVO } from "@/lib/clases";

export function PestanaAprende({ clases }: { clases: Clase[] }) {
  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/25">
            <Magnet className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-white">¿Qué es una resonancia magnética?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Es un examen que usa un campo magnético y ondas de radio (sin radiación ionizante) para obtener imágenes
              detalladas del interior del cuerpo. En el cerebro permite ver tejidos blandos con gran nitidez, por eso es
              una herramienta clave para estudiar tumores. Las imágenes que usa este proyecto son cortes (como
              &quot;rebanadas&quot;) de resonancias cerebrales clasificados en 4 grupos.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {clases.map((clase, i) => {
          const contenido = CONTENIDO_EDUCATIVO[clase.id];
          return (
            <motion.article
              key={clase.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass relative overflow-hidden rounded-3xl p-5 sm:p-6"
            >
              {/* Franja de color de la clase */}
              <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: clase.color }} aria-hidden />
              <span
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: clase.color }}
                aria-hidden
              />
              <h3 className="flex items-center gap-2 font-display text-xl font-semibold" style={{ color: clase.color }}>
                {clase.nombre}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{clase.descripcion}</p>

              {contenido && (
                <>
                  <div className="mt-4 rounded-2xl bg-white/[0.03] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                      <Lightbulb className="h-3.5 w-3.5" aria-hidden /> En simple
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{contenido.enSimple}</p>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {contenido.puntosClave.map((punto) => (
                      <li key={punto} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: clase.color }} aria-hidden />
                        <span>{punto}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 flex gap-2 border-t border-white/5 pt-3 text-xs leading-relaxed text-slate-400">
                    <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      <strong className="font-medium text-slate-300">En la resonancia: </strong>
                      {contenido.enLaResonancia}
                    </span>
                  </p>
                </>
              )}
            </motion.article>
          );
        })}
      </div>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <ShieldAlert className="h-5 w-5 text-amber-300" aria-hidden />
            Lo que esta app NO puede hacer
          </h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300 marker:text-amber-300">
            <li>Diagnosticar: solo un equipo médico puede hacerlo, con exámenes completos e historia clínica.</li>
            <li>Detectar enfermedades distintas a las 4 clases que aprendió.</li>
            <li>Determinar si un tumor es benigno o maligno, su grado o su tamaño.</li>
            <li>Funcionar bien con imágenes muy distintas a las del entrenamiento (otros equipos, fotos de pantalla, etc.).</li>
          </ul>
        </div>
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <BookOpen className="h-5 w-5 text-cyan-300" aria-hidden />
            Para seguir aprendiendo
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Los textos de esta sección son resúmenes educativos escritos en lenguaje simple. Para información médica
            confiable, consulta fuentes reconocidas como el National Cancer Institute (cancer.gov), MedlinePlus en
            español (medlineplus.gov/spanish) o el Ministerio de Salud de Chile, y conversa siempre con un profesional
            de salud.
          </p>
        </div>
      </section>
    </div>
  );
}
