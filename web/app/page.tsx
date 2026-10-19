import { NeuroLensApp } from "@/components/NeuroLensApp";

// Toda la app es un cliente estático que conversa con el backend (FastAPI) vía fetch
export default function Home() {
  return <NeuroLensApp />;
}
