"use client";

import { useSyncExternalStore } from "react";
import type { ClaseId } from "./api";

// Pequeño "store" sobre localStorage compatible con useSyncExternalStore:
// React lee el valor guardado sin causar errores de hidratación
// (en el servidor siempre se usa el valor inicial).
function crearStore<T>(clave: string, inicial: T) {
  const oyentes = new Set<() => void>();
  let crudoEnCache: string | null = null;
  let valorEnCache: T = inicial;

  function leer(): T {
    let crudo: string | null = null;
    try {
      crudo = window.localStorage.getItem(clave);
    } catch {
      return valorEnCache; // modo incógnito estricto u otro bloqueo del navegador
    }
    // Solo re-parseamos si el texto cambió: useSyncExternalStore exige
    // devolver el mismo objeto mientras el dato no cambie.
    if (crudo !== crudoEnCache) {
      crudoEnCache = crudo;
      try {
        valorEnCache = crudo ? (JSON.parse(crudo) as T) : inicial;
      } catch {
        valorEnCache = inicial;
      }
    }
    return valorEnCache;
  }

  function guardar(actualizar: (previo: T) => T) {
    const nuevo = actualizar(leer());
    try {
      window.localStorage.setItem(clave, JSON.stringify(nuevo));
    } catch {
      // cuota llena o almacenamiento bloqueado: el dato simplemente no se guarda
      return;
    }
    oyentes.forEach((o) => o());
  }

  function suscribir(oyente: () => void) {
    oyentes.add(oyente);
    // Sincroniza entre pestañas del navegador
    const alCambiarOtraPestana = (e: StorageEvent) => {
      if (e.key === clave) oyente();
    };
    window.addEventListener("storage", alCambiarOtraPestana);
    return () => {
      oyentes.delete(oyente);
      window.removeEventListener("storage", alCambiarOtraPestana);
    };
  }

  function useValor(): T {
    return useSyncExternalStore(suscribir, leer, () => inicial);
  }

  return { useValor, guardar };
}

// ---------- Historial de predicciones ----------

export interface EntradaHistorial {
  id: string;
  /** miniatura JPEG de ~96 px como data URL (liviana para localStorage) */
  miniatura: string;
  clase: ClaseId;
  nombre: string;
  confianza: number;
  bajaConfianza: boolean;
  fecha: string; // ISO
  origen: string; // nombre del archivo o del ejemplo
}

const MAX_HISTORIAL = 30;
const historialStore = crearStore<EntradaHistorial[]>("neurolens:historial", []);

export const useHistorial = historialStore.useValor;

export function agregarAlHistorial(entrada: EntradaHistorial) {
  historialStore.guardar((previo) => [entrada, ...previo].slice(0, MAX_HISTORIAL));
}

export function borrarHistorial() {
  historialStore.guardar(() => []);
}

// ---------- Marcador del desafío Humano vs IA ----------

export interface Marcador {
  rondas: number;
  humano: number;
  ia: number;
}

const MARCADOR_INICIAL: Marcador = { rondas: 0, humano: 0, ia: 0 };
const marcadorStore = crearStore<Marcador>("neurolens:marcador", MARCADOR_INICIAL);

export const useMarcador = marcadorStore.useValor;

export function registrarRonda(humanoAcierta: boolean, iaAcierta: boolean) {
  marcadorStore.guardar((m) => ({
    rondas: m.rondas + 1,
    humano: m.humano + (humanoAcierta ? 1 : 0),
    ia: m.ia + (iaAcierta ? 1 : 0),
  }));
}

export function reiniciarMarcador() {
  marcadorStore.guardar(() => MARCADOR_INICIAL);
}
