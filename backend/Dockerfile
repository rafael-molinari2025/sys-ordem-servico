# Build a partir da raiz do monorepo (contexto = raiz do repositorio), pois o backend
# depende do workspace "shared" via path alias do npm workspaces.
#
# Usa a imagem oficial do Puppeteer, que ja vem com o Google Chrome e todas as
# dependencias de sistema necessarias (fontes, libnss3, libgtk etc.) instaladas -
# evita ter que descobrir/instalar manualmente essa lista de pacotes apt.
FROM ghcr.io/puppeteer/puppeteer:22.15.0

USER root
WORKDIR /app

ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Copia apenas os manifestos primeiro para aproveitar o cache de camadas do Docker
# entre builds quando so o codigo-fonte muda.
COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --workspace shared --workspace backend

COPY shared shared
COPY backend backend

RUN npm run build --workspace shared \
    && npx prisma generate --schema=backend/prisma/schema.prisma

WORKDIR /app/backend

EXPOSE 3333

# Migrações do banco rodam antes de subir o servidor (deploy = schema já em dia).
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/server.ts"]
