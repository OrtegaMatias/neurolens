"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, obtenerInfo, type Info } from "./api";

/**
 * - conectando: primer intento en curso
 * - despertando: el servidor no responde aún (en HF Spaces un "cold start" toma ~30 s); reintentamos solos
 * - listo: /api/info respondió
 * - caido: se agotaron los reintentos automáticos; el usuario puede reintentar a mano
 */
export type EstadoServidor = "conectando" | "despertando" | "listo" | "caido";

const MAX_INTENTOS = 12;
const ESPERA_ENTRE_INTENTOS_MS = 5_000;

export function useInfoServidor() {
  const [info, setInfo] = useState<Info | null>(null);
  const [estado, setEstado] = useState<EstadoServidor>("conectando");
  const [intento, setIntento] = useState(0);
  // Cambiar `ciclo` vuelve a ejecutar el efecto (reintento manual)
  const [ciclo, setCiclo] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let intentos = 0;
    let reintento: number | undefined;
    // Si en 4 s no hay respuesta, avisamos que el servidor probablemente está despertando
    const aviso = window.setTimeout(() => setEstado((e) => (e === "conectando" ? "despertando" : e)), 4_000);

    const intentar = async () => {
      intentos += 1;
      try {
        const datos = await obtenerInfo(controller.signal);
        clearTimeout(aviso);
        setInfo(datos);
        setEstado("listo");
      } catch (err) {
        if (controller.signal.aborted) return;
        // Sin conexión o 502/503/504 = típicamente el contenedor aún está arrancando.
        // /api/info es público, así que nunca debería responder 401; otros errores no se reintentan.
        const recuperable = err instanceof ApiError && (err.status === null || [502, 503, 504].includes(err.status));
        if (recuperable && intentos < MAX_INTENTOS) {
          setIntento(intentos);
          setEstado("despertando");
          reintento = window.setTimeout(intentar, ESPERA_ENTRE_INTENTOS_MS);
        } else {
          clearTimeout(aviso);
          setEstado("caido");
        }
      }
    };
    void intentar();

    return () => {
      controller.abort();
      clearTimeout(aviso);
      clearTimeout(reintento);
    };
  }, [ciclo]);

  const reintentar = useCallback(() => {
    setEstado("conectando");
    setCiclo((c) => c + 1);
  }, []);

  return { info, estado, intento, maxIntentos: MAX_INTENTOS, reintentar };
}
