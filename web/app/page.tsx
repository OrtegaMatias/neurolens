import { ControlAcceso } from "@/components/ControlAcceso";

// Cliente estático: ControlAcceso muestra la pantalla de acceso o la app según la sesión.
// Las llamadas a /api/* son relativas; Next las reenvía al backend FastAPI (ver next.config.ts).
export default function Home() {
  return <ControlAcceso />;
}
