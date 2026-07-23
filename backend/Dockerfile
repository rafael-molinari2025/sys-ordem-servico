# Build a partir da raiz do monorepo (contexto = raiz do repositorio), pois o backend
# depende do workspace "shared" via path alias do npm workspaces.
#
# Usa a imagem oficial do Puppeteer como base so pelas dependencias de sistema do Chrome
# ja instaladas (fontes, libnss3, libgtk etc.) - NAO fixamos PUPPETEER_EXECUTABLE_PATH
# porque o Chrome pre-instalado dessa imagem fica num caminho gerenciado pelo proprio
# puppeteer (nao em /usr/bin/google-chrome-stable) e um caminho hardcoded errado faz
# puppeteer.executablePath() lancar excecao sincrona no import do modulo do WhatsApp,
# derrubando o processo antes mesmo de abrir a porta HTTP. Deixamos o `npm ci` baixar o
# Chrome pelo mecanismo padrao do puppeteer, que resolve o executablePath corretamente.
FROM ghcr.io/puppeteer/puppeteer:22.15.0

USER root
WORKDIR /app

ENV NODE_ENV=production

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
