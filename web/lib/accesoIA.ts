"use client";

import { createContext, useContext } from "react";

// Dos niveles de acceso: invitado (todo menos IA generativa) o con clave (IA generativa activa).
// Este contexto lo provee ControlAcceso y lo usan las tarjetas de IA y el encabezado.
export interface AccesoIA {
  /** true si hay una sesión con clave vigente (cookie HttpOnly) */
  ia: boolean;
  /** mensaje a mostrar en el estado bloqueado (p. ej. clave expirada) */
  avisoIA: string | null;
  /** llamar tras un `entrar(clave)` exitoso */
  activarIA: () => void;
  /** llamar cuando un endpoint de IA responde 401 (la clave rota a diario) */
  expirarIA: () => void;
}

export const ContextoAccesoIA = createContext<AccesoIA>({
  ia: false,
  avisoIA: null,
  activarIA: () => {},
  expirarIA: () => {},
});

export function useAccesoIA(): AccesoIA {
  return useContext(ContextoAccesoIA);
}
