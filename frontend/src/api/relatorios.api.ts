import { StatusOS } from "shared";
import { api } from "./client";

function abrirPdf(blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank");
}

export async function baixarRelatorioOS(filtros: { inicio?: string; fim?: string; status?: StatusOS; clienteId?: string }) {
  const { data } = await api.get("/relatorios/os", { params: filtros, responseType: "blob" });
  abrirPdf(data);
}

export async function baixarRelatorioFinanceiro(filtros: { inicio?: string; fim?: string }) {
  const { data } = await api.get("/relatorios/financeiro", { params: filtros, responseType: "blob" });
  abrirPdf(data);
}

export async function baixarRelatorioEstoque(filtros: { inicio?: string; fim?: string }) {
  const { data } = await api.get("/relatorios/estoque", { params: filtros, responseType: "blob" });
  abrirPdf(data);
}

export async function baixarRelatorioCliente(clienteId: string) {
  const { data } = await api.get(`/relatorios/cliente/${clienteId}`, { responseType: "blob" });
  abrirPdf(data);
}
