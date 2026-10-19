# Frontend NeuroLens (Next.js standalone)
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Mismo origen: el navegador llama a /api/... y Next lo reenvía al backend
ARG NEXT_PUBLIC_REPO_URL=""
ENV NEXT_PUBLIC_API_URL=/ \
    NEXT_PUBLIC_REPO_URL=$NEXT_PUBLIC_REPO_URL \
    API_INTERNA_URL=http://api:7860 \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
