import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" genera un servidor Node mínimo para la imagen Docker
  output: "standalone",
  // En el servidor, /api/* se reenvía al backend FastAPI por la red interna de Docker
  // (API_INTERNA_URL se define al construir la imagen; en local no se usa).
  async rewrites() {
    const api = process.env.API_INTERNA_URL;
    return api ? [{ source: "/api/:ruta*", destination: `${api}/api/:ruta*` }] : [];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
