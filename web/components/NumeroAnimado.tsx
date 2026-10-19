"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";
import { porcentaje } from "@/lib/formato";

// Muestra un porcentaje que "cuenta" desde 0 hasta el valor final (valor = proporción 0–1).
// Escribimos directo en el DOM (sin estado de React) para no re-renderizar en cada cuadro.
export function NumeroAnimado({ valor, decimales = 1, className }: { valor: number; decimales?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    const controles = animate(0, valor, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        nodo.textContent = porcentaje(v, decimales);
      },
    });
    return () => controles.stop();
  }, [valor, decimales]);

  return (
    <span ref={ref} className={className}>
      {porcentaje(valor, decimales)}
    </span>
  );
}
