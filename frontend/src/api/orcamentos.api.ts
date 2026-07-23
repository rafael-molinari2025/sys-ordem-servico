import { api } from "./client";

export async function enviarOrcamentoPorWhatsApp(ordemId: string): Promise<void> {
  await api.post(`/ordens/${ordemId}/orcamento/enviar`);
}

export async function baixarPdfOrcamento(ordemId: string): Promise<void> {
  const { data } = await api.get(`/ordens/${ordemId}/orcamento/pdf`, { responseType: "blob" });
  const url = window.URL.createObjectURL(data);
  window.open(url, "_blank");
}
