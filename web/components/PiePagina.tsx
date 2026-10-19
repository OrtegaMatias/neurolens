import { FolderGit2 } from "lucide-react";
import { LogoUDD } from "./LogoUDD";

const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL;

export function PiePagina() {
  return (
    <footer className="mt-16 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
          <LogoUDD className="h-9 w-auto shrink-0" />
          <div>
            <p className="font-medium text-slate-400">
              Universidad del Desarrollo · IA para la Gestión Industrial ·
              Certamen 1
            </p>
            <p className="mt-1">
              Proyecto académico con fines exclusivamente educativos. Los
              resultados no reemplazan la evaluación de un profesional de salud.
            </p>
          </div>
        </div>
        {/* El enlace se configura con NEXT_PUBLIC_REPO_URL (ver .env.example) */}
        <a
          href={REPO_URL || "#"}
          target={REPO_URL ? "_blank" : undefined}
          rel="noreferrer"
          aria-disabled={!REPO_URL}
          title={
            REPO_URL ? "Ver el código fuente" : "Repositorio aún no configurado"
          }
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
        >
          <FolderGit2 className="h-4 w-4" aria-hidden />
          Código en GitHub
        </a>
      </div>
    </footer>
  );
}
