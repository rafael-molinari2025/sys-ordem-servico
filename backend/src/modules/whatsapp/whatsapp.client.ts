import { Client, LocalAuth } from "whatsapp-web.js";
import QRCode from "qrcode";
import { WhatsappStatus } from "shared";
import { env } from "../../config/env";
import { chromiumExecutablePath } from "../../pdf/pdf.engine";
import { logger } from "../../lib/logger";

let status: WhatsappStatus = "DISCONNECTED";
let qrDataUrl: string | null = null;

export const whatsappClient = new Client({
  authStrategy: new LocalAuth({ dataPath: env.WHATSAPP_SESSION_PATH }),
  puppeteer: {
    executablePath: chromiumExecutablePath(),
    headless: true,
    args: ["--no-sandbox"],
  },
  // A versão do WhatsApp Web empacotada no whatsapp-web.js fica desatualizada entre releases da
  // lib (o WhatsApp muda o protocolo do lado web com frequência), o que faz o pareamento do QR
  // falhar com "não foi possível conectar o dispositivo" no celular mesmo com o QR sendo escaneado
  // corretamente. Buscar a versão mais recente testada de um cache remoto mantido pela comunidade
  // evita depender da versão fixa que veio junto com a lib na hora da instalação.
  webVersionCache: {
    type: "remote",
    remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1044431423-alpha.html",
  },
});

whatsappClient.on("qr", async (qr) => {
  status = "QR_PENDING";
  try {
    qrDataUrl = await QRCode.toDataURL(qr);
  } catch (err) {
    logger.error("Falha ao gerar QR code do WhatsApp:", err);
  }
});

whatsappClient.on("ready", () => {
  status = "CONNECTED";
  qrDataUrl = null;
  logger.info("WhatsApp conectado.");
});

whatsappClient.on("auth_failure", (msg) => {
  status = "AUTH_FAILED";
  logger.error("Falha de autenticação do WhatsApp:", msg);
});

whatsappClient.on("disconnected", (reason) => {
  status = "DISCONNECTED";
  qrDataUrl = null;
  logger.warn("WhatsApp desconectado:", reason);
});

/** Dispara a inicialização em segundo plano — nunca bloqueia a subida do servidor HTTP. */
export function initWhatsApp() {
  whatsappClient.initialize().catch((err) => {
    status = "DISCONNECTED";
    logger.error("Erro ao inicializar o WhatsApp:", err);
  });
}

export function getWhatsAppStatus(): { status: WhatsappStatus; qr: string | null } {
  return { status, qr: status === "QR_PENDING" ? qrDataUrl : null };
}

export function isWhatsAppConnected(): boolean {
  return status === "CONNECTED";
}
