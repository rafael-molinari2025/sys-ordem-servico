import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

// Rede de segurança contra rejeições/exceções fora do ciclo de request/response (ex.: operações
// assíncronas do Puppeteer usado na geração de PDF); sem isso, uma falha isolada derruba o
// processo Node inteiro e tira a API do ar por causa de algo que não deveria ser fatal.
process.on("unhandledRejection", (reason) => {
  logger.error("Promise rejeitada sem tratamento:", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Exceção não capturada:", err);
});

app.listen(env.PORT, () => {
  logger.info(`Backend rodando em http://localhost:${env.PORT}`);
});
