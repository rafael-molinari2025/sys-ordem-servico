import { MessageMedia } from "whatsapp-web.js";
import { ValidationError, WhatsAppNaoConectadoError } from "../../errors";
import { isWhatsAppConnected, whatsappClient } from "./whatsapp.client";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolve um telefone armazenado (ex.: "5511999999999") para o id de chat do WhatsApp Web.
 * Não basta montar "<numero>@c.us" na mão — desde a migração do WhatsApp para o sistema de LID
 * (Linked ID), enviar direto pra um chat nunca resolvido pela sessão gera "Error: No LID for user".
 * `getNumberId` faz essa resolução oficial e também confirma que o número existe no WhatsApp.
 */
async function resolveChatId(telefone: string): Promise<string> {
  const digitos = telefone.replace(/\D/g, "");
  const contactId = await whatsappClient.getNumberId(digitos);
  if (!contactId) {
    throw new ValidationError(`O telefone ${telefone} não está registrado no WhatsApp — verifique o cadastro do cliente.`);
  }
  return contactId._serialized;
}

/**
 * Envia o PDF do orçamento seguido de uma mensagem de texto com o link de autorização.
 * Um pequeno atraso entre as duas mensagens evita um padrão de envio robótico
 * (mitigação de risco de bloqueio — ver aviso no manual sobre whatsapp-web.js).
 */
export async function sendOrcamento(
  telefone: string,
  pdfBuffer: Buffer,
  mensagem: string,
  linkAutorizacao: string
): Promise<void> {
  if (!isWhatsAppConnected()) {
    throw new WhatsAppNaoConectadoError();
  }

  const chatId = await resolveChatId(telefone);
  const media = new MessageMedia("application/pdf", pdfBuffer.toString("base64"), "orcamento.pdf");

  await whatsappClient.sendMessage(chatId, media);
  await delay(1200);
  await whatsappClient.sendMessage(chatId, `${mensagem}\n\n${linkAutorizacao}`);
}

/** Envia uma mensagem de texto simples (ex.: link de redefinição de senha). */
export async function sendTexto(telefone: string, mensagem: string): Promise<void> {
  if (!isWhatsAppConnected()) {
    throw new WhatsAppNaoConectadoError();
  }
  const chatId = await resolveChatId(telefone);
  await whatsappClient.sendMessage(chatId, mensagem);
}
