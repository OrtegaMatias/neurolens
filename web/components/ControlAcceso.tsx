"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ContextoAccesoIA, type AccesoIA } from "@/lib/accesoIA";
import { ApiError, salir, verificarSesion } from "@/lib/api";
import { Landing } from "./Landing";
import { Logo } from "./Logo";
import { NeuroLensApp } from "./NeuroLensApp";

type Pantalla = "verificando" | "landing" | "app";

// Recuerda que la persona ya entró (como invitada o con clave) para saltarse la landing al recargar
const CLAVE_RECORDAR = "neurolens:entro";
const MAX_INTENTOS = 12;
const ESPERA_ENTRE_INTENTOS_MS = 5_000;

function leerEntrada(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_RECORDAR) === "1";
  } catch {
    return false; // sin acceso a localStorage: se trata como primera visita
  }
}

function recordarEntrada(si: boolean) {
  try {
    if (si) window.localStorage.setItem(CLAVE_RECORDAR, "1");
    else window.localStorage.removeItem(CLAVE_RECORDAR);
  } catch {
    // almacenamiento bloqueado: simplemente no se recuerda
  }
}

// Decide qué se muestra (landing o app) y si la IA generativa está habilitada.
// Niveles: invitado = todo menos IA generativa; con clave = además recomendaciones y explicaciones.
export function ControlAcceso() {
  const [estadoPantalla, setPantalla] = useState<Pantalla>("verificando");
  const [ia, setIa] = useState(false);
  const [avisoIA, setAvisoIA] = useState<string | null>(null);
  // Leído con useSyncExternalStore: en el servidor (prerender) es false, en el navegador el valor guardado
  const yaEntro = useSyncExternalStore(
    () => () => {},
    leerEntrada,
    () => false,
  );
  // Si ya había entrado antes, va directo a la app sin esperar a /api/sesion
  const pantalla: Pantalla = estadoPantalla === "verificando" && yaEntro ? "app" : estadoPantalla;

  // Al cargar preguntamos a /api/sesion si la cookie de la clave sigue vigente
  // (reintentando si el servidor está despertando).
  useEffect(() => {
    // Tras verificar: con clave → app; sin clave → app si ya había entrado, si no la landing
    const sinClave = (p: Pantalla): Pantalla => (p === "verificando" ? (leerEntrada() ? "app" : "landing") : p);

    const controller = new AbortController();
    let intentos = 0;
    let reintento: number | undefined;

    const intentar = async () => {
      intentos += 1;
      try {
        const sesion = await verificarSesion(controller.signal);
        if (sesion.ia) {
          setIa(true);
          setPantalla("app");
        } else {
          setPantalla(sinClave);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        // Mientras el servidor despierta mostramos la landing (entrar como invitado no lo necesita)
        setPantalla(sinClave);
        const recuperable = err instanceof ApiError && (err.status === null || [502, 503, 504].includes(err.status));
        if (recuperable && intentos < MAX_INTENTOS) {
          reintento = window.setTimeout(intentar, ESPERA_ENTRE_INTENTOS_MS);
        }
      }
    };
    void intentar();

    return () => {
      controller.abort();
      clearTimeout(reintento);
    };
  }, []);

  const activarIA = useCallback(() => {
    setIa(true);
    setAvisoIA(null);
  }, []);

  const expirarIA = useCallback(() => {
    setIa(false);
    setAvisoIA("Tu clave expiró (rota a diario). Ingresa la vigente.");
  }, []);

  const entrar = useCallback(
    (conClave: boolean) => {
      recordarEntrada(true);
      if (conClave) activarIA();
      setPantalla("app");
    },
    [activarIA],
  );

  const cerrarSesion = useCallback(async () => {
    try {
      await salir();
    } catch {
      // aunque falle la llamada, volvemos a la landing
    }
    recordarEntrada(false);
    setIa(false);
    setAvisoIA(null);
    setPantalla("landing");
  }, []);

  const contexto = useMemo<AccesoIA>(() => ({ ia, avisoIA, activarIA, expirarIA }), [ia, avisoIA, activarIA, expirarIA]);

  if (pantalla === "verificando") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center" role="status">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <Logo className="h-14 w-14" />
        </motion.div>
        <p className="text-sm text-slate-400">Cargando…</p>
      </div>
    );
  }

  return (
    <ContextoAccesoIA.Provider value={contexto}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pantalla}
          className="flex flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {pantalla === "app" ? (
            <NeuroLensApp onSalir={cerrarSesion} />
          ) : (
            <Landing onInvitado={() => entrar(false)} onConClave={() => entrar(true)} />
          )}
        </motion.div>
      </AnimatePresence>
    </ContextoAccesoIA.Provider>
  );
}
