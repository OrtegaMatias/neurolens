"use client";

import { useRef, useState, type DragEvent } from "react";
import { Camera, ImageOff, Upload } from "lucide-react";
import type { Clase } from "@/lib/api";
import { EJEMPLOS, type Ejemplo } from "@/lib/ejemplos";

const MAX_MB = 10;

interface Props {
  clases: Clase[];
  deshabilitado: boolean;
  onArchivo: (archivo: File) => void;
  onEjemplo: (ejemplo: Ejemplo) => void;
}

export function ZonaCarga({ clases, deshabilitado, onArchivo, onEjemplo }: Props) {
  const inputArchivo = useRef<HTMLInputElement>(null);
  const inputCamara = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validamos tipo y tamaño antes de enviar al servidor
  const recibir = (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPG, PNG, …).");
      return;
    }
    if (archivo.size > MAX_MB * 1024 * 1024) {
      setError(`La imagen supera los ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    onArchivo(archivo);
  };

  const alSoltar = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(false);
    if (!deshabilitado) recibir(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-5">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={deshabilitado}
        aria-label="Subir una imagen de resonancia magnética"
        onClick={() => !deshabilitado && inputArchivo.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !deshabilitado) {
            e.preventDefault();
            inputArchivo.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
          arrastrando
            ? "border-cyan-300 bg-cyan-400/10"
            : "border-white/15 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-cyan-400/5"
        } ${deshabilitado ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/30 transition group-hover:scale-105">
          <Upload className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="font-medium text-slate-100">Arrastra una resonancia aquí o haz clic para elegirla</p>
          <p className="mt-1 text-sm text-slate-400">JPG o PNG · máximo {MAX_MB} MB · cortes axiales, coronales o sagitales</p>
        </div>
        <input
          ref={inputArchivo}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            recibir(e.target.files?.[0]);
            e.target.value = ""; // permite volver a elegir el mismo archivo
          }}
        />
      </div>

      {/* En celulares, `capture` abre directamente la cámara */}
      <button
        type="button"
        disabled={deshabilitado}
        onClick={() => inputCamara.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-100 disabled:opacity-50 sm:hidden"
      >
        <Camera className="h-4 w-4" aria-hidden />
        Tomar foto con la cámara
      </button>
      <input
        ref={inputCamara}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          recibir(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">¿No tienes una? Prueba un ejemplo</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {EJEMPLOS.map((ej) => (
            <MiniaturaEjemplo
              key={ej.src}
              ejemplo={ej}
              clase={clases.find((c) => c.id === ej.clase)}
              deshabilitado={deshabilitado}
              onClick={() => onEjemplo(ej)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniaturaEjemplo({
  ejemplo,
  clase,
  deshabilitado,
  onClick,
}: {
  ejemplo: Ejemplo;
  clase?: Clase;
  deshabilitado: boolean;
  onClick: () => void;
}) {
  const [fallo, setFallo] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado || fallo}
      title={fallo ? "Imagen de ejemplo no disponible" : `Ejemplo: ${clase?.nombre ?? ejemplo.clase}`}
      className="group overflow-hidden rounded-xl border border-white/10 bg-black text-left transition hover:border-cyan-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="relative aspect-square">
        {fallo ? (
          <div className="flex h-full items-center justify-center text-slate-600">
            <ImageOff className="h-5 w-5" aria-hidden />
          </div>
        ) : (
          <img
            src={ejemplo.src}
            alt={`Resonancia de ejemplo: ${clase?.nombre ?? ejemplo.clase}`}
            onError={() => setFallo(true)}
            // Si la imagen falló antes de que React se "hidratara", onError no alcanza a dispararse
            ref={(img) => {
              if (img?.complete && img.naturalWidth === 0) setFallo(true);
            }}
            className="h-full w-full object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-100"
          />
        )}
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: clase?.color }} aria-hidden />
        <span className="truncate text-[11px] text-slate-300 sm:text-xs">{clase?.nombre ?? ejemplo.clase}</span>
      </div>
    </button>
  );
}
