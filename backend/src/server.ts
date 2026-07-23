import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { initWhatsApp } from "./modules/whatsapp/whatsapp.client";

// whatsapp-web.js dispara operações internas (puppeteer) fora do ciclo de request/response
// que podem rejeitar sem handler (ex.: "auth timeout"); sem isso, o processo Node inteiro
// derruba a API por causa de uma falha isolada do WhatsApp.
process.on("unhandledRejection", (reason) => {
  logger.error("Promise rejeitada sem tratamento:", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Exceção não capturada:", err);
});

app.listen(env.PORT, () => {
  logger.info(`Backend rodando em http://localhost:${env.PORT}`);
});

initWhatsApp();
