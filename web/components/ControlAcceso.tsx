"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ApiError, EVENTO_SESION_EXPIRADA, salir, verificarSesion } from "@/lib/api";
import { Landing } from "./Landing";
import { Logo } from "./Logo";
import { NeuroLensApp } from "./NeuroLensApp";

type Acceso =
  | { tipo: "verificando"; despertando: boolean }
  | { tipo: "fuera"; mensaje?: string }
  | { tipo: "dentro" };

const MAX_INTENTOS = 12;
const ESPERA_ENTRE_INTENTOS_MS = 5_000;

// Decide qué se muestra: pantalla de acceso (landing) o la app, según la cookie de sesión.
export function ControlAcceso() {
  const [acceso, setAcceso] = useState<Acceso>({ tipo: "verificando", despertando: false });

  // 1) Al cargar, preguntamos al backend si la sesión sigue vigente (con reintentos si está despertando)
  useEffect(() => {
    const controller = new AbortController();
    let intentos = 0;
    let reintento: number | undefined;

    const intentar = async () => {
      intentos += 1;
      try {
        const valida = await verificarSesion(controller.signal);
        setAcceso(valida ? { tipo: "dentro" } : { tipo: "fuera" });
      } catch (err) {
        if (controller.signal.aborted) return;
        const recuperable = err instanceof ApiError && (err.status === null || [502, 503, 504].includes(err.status));
        if (recuperable && intentos < MAX_INTENTOS) {
          setAcceso({ tipo: "verificando", despertando: true });
          reintento = window.setTimeout(intentar, ESPERA_ENTRE_INTENTOS_MS);
        } else {
          setAcceso({
            tipo: "fuera",
            mensaje: "No pudimos verificar tu sesión: el servidor no responde. Puedes intentar ingresar igualmente.",
          });
        }
      }
    };
    void intentar();

    return () => {
      controller.abort();
      clearTimeout(reintento);
    };
  }, []);

  // 2) Cualquier 401 posterior (sesión vencida o clave rotada) nos devuelve a la pantalla de acceso
  useEffect(() => {
    const alExpirar = () =>
      setAcceso((a) => (a.tipo === "dentro" ? { tipo: "fuera", mensaje: "Tu sesión expiró. Ingresa la clave vigente." } : a));
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await salir();
    } catch {
      // aunque falle la llamada, mostramos la pantalla de acceso
    }
    setAcceso({ tipo: "fuera" });
  }, []);

  if (acceso.tipo === "verificando") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center" role="status">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <Logo className="h-14 w-14" />
        </motion.div>
        <p className="text-sm text-slate-400">
          {acceso.despertando
            ? "Despertando el servidor… puede tardar unos 30 segundos."
            : "Verificando acceso…"}
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {acceso.tipo === "dentro" ? (
        <motion.div
          key="app"
          className="flex flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <NeuroLensApp onSalir={cerrarSesion} />
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          className="flex flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Landing mensaje={acceso.mensaje} onEntrar={() => setAcceso({ tipo: "dentro" })} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
