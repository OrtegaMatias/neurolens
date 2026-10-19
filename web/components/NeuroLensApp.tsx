"use client";

import { useMemo, type ReactNode } from "react";
import { useHistorial } from "@/lib/almacenamiento";
import { combinarClases } from "@/lib/clases";
import { useInfoServidor } from "@/lib/useInfoServidor";
import { AvisoServidor } from "./AvisoServidor";
import { Encabezado } from "./Encabezado";
import { PestanaAnalizar } from "./PestanaAnalizar";
import { PestanaAprende } from "./PestanaAprende";
import { PestanaDesafio } from "./PestanaDesafio";
import { PestanaHistorial } from "./PestanaHistorial";
import { PestanaModelo } from "./PestanaModelo";
import { PESTANAS, Pestanas, usePestanaActiva, type PestanaId } from "./Pestanas";
import { PiePagina } from "./PiePagina";

// Componente raíz: carga /api/info una vez y reparte los datos a cada pestaña.
export function NeuroLensApp() {
  const { info, estado, intento, maxIntentos, reintentar } = useInfoServidor();
  const clases = useMemo(() => combinarClases(info?.clases), [info]);
  const [activa, cambiarPestana] = usePestanaActiva();
  const historial = useHistorial();

  // Todas las pestañas quedan montadas (solo se ocultan) para no perder su estado al cambiar
  const contenido: Record<PestanaId, ReactNode> = {
    analizar: <PestanaAnalizar clases={clases} metricas={info?.metricas} />,
    desafio: <PestanaDesafio clases={clases} umbral={info?.umbral} metricas={info?.metricas} />,
    aprende: <PestanaAprende clases={clases} />,
    modelo: <PestanaModelo info={info} clases={clases} />,
    historial: <PestanaHistorial clases={clases} />,
  };

  return (
    <>
      <Encabezado estado={estado} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 sm:px-6">
        <AvisoServidor estado={estado} intento={intento} maxIntentos={maxIntentos} onReintentar={reintentar} />
        <Pestanas activa={activa} onCambiar={cambiarPestana} contadorHistorial={historial.length} />
        {PESTANAS.map(({ id }) => (
          // La animación CSS "aparecer" se reinicia sola cada vez que el panel deja de estar oculto
          <div
            key={id}
            role="tabpanel"
            id={`panel-${id}`}
            aria-labelledby={`tab-${id}`}
            hidden={id !== activa}
            className="animate-[aparecer_0.35s_ease-out]"
          >
            {contenido[id]}
          </div>
        ))}
      </main>
      <PiePagina />
    </>
  );
}
