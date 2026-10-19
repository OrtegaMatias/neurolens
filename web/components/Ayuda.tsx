"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleHelp } from "lucide-react";

// Ícono "?" con una explicación emergente. Funciona con mouse, teclado y toque.
export function Ayuda({ children, etiqueta = "Más información" }: { children: ReactNode; etiqueta?: string }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <button
        type="button"
        aria-label={etiqueta}
        aria-describedby={abierto ? id : undefined}
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        className="rounded-full text-slate-400 transition hover:text-cyan-300 focus-visible:text-cyan-300 focus-visible:outline-none"
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 z-30 mb-2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-white/10 bg-slate-900/95 p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-slate-200 shadow-xl backdrop-blur"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
