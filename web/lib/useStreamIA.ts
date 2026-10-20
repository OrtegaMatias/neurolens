"use client";

import { useEffect, useRef, useState } from "react";
import { useAccesoIA } from "./accesoIA";
import { ApiError } from "./api";

export type EstadoStreamIA = "inicial" | "generando" | "listo" | "error";

/** Función que pide texto al LLM y entrega cada trozo a `alRecibir` (ver `recomendar` / `explicarDesafio`). */
export type FuenteStreamIA = (alRecibir: (trozo: string) => void, signal: AbortSignal) => Promise<void>;

/**
 * Estado compartido para textos de Claude en streaming: acumula los trozos,
 * permite detener o regenerar y traduce los errores a mensajes amables.
 */
export function useStreamIA(fuente: FuenteStreamIA) {
  const { expirarIA } = useAccesoIA();
  const [estado, setEstado] = useState<EstadoStreamIA>("inicial");
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const controlador = useRef<AbortController | null>(null);

  // Si el componente desaparece (nueva imagen o ronda), cancelamos el streaming pendiente
  useEffect(() => () => controlador.current?.abort(), []);

  const generar = async () => {
    controlador.current?.abort();
    const c = new AbortController();
    controlador.current = c;
    setTexto("");
    setError(null);
    setEstado("generando");
    try {
      // Cada trozo recibido se agrega al texto: así se ve "escribiéndose" en pantalla
      await fuente((trozo) => setTexto((t) => t + trozo), c.signal);
      setEstado("listo");
    } catch (err) {
      if (c.signal.aborted) {
        setEstado((e) => (e === "generando" ? "listo" : e));
        return;
      }
      // 401 = la clave expiró (rota a diario): volvemos al modo invitado y la tarjeta muestra el bloqueo
      if (err instanceof ApiError && err.status === 401) {
        setTexto("");
        setEstado("inicial");
        expirarIA();
        return;
      }
      if (err instanceof ApiError && err.status === 503) {
        setError(
          "El asistente de IA no está disponible en este momento (el servidor no tiene configurada la clave de Anthropic o el servicio está saturado). El resto de la app sigue funcionando.",
        );
      } else {
        setError(err instanceof Error ? err.message : "No se pudo generar el texto.");
      }
      setEstado("error");
    }
  };

  return { estado, texto, error, generar, detener: () => controlador.current?.abort() };
}
