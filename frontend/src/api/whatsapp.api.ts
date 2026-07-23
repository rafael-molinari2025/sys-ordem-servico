import { WhatsappStatus } from "shared";
import { api } from "./client";

export interface WhatsAppStatusResponse {
  status: WhatsappStatus;
  qr: string | null;
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
  const { data } = await api.get<WhatsAppStatusResponse>("/whatsapp/status");
  return data;
}
