import { OrdemServicoDTO, StatusOS } from "shared";
import { api } from "./client";

export interface OrdemInput {
  clienteId: string;
  itemDescricao: string;
  itemMarca?: string;
  itemModelo?: string;
  itemNumeroSerie?: string;
  responsavelId?: string;
  observacoes?: string;
  dataPrevisao?: string;
}

export async function listarOrdens(filtros?: { status?: StatusOS; clienteId?: string }): Promise<OrdemServicoDTO[]> {
  const { data } = await api.get<OrdemServicoDTO[]>("/ordens", { params: filtros });
  return data;
}

export async function buscarOrdem(id: string): Promise<OrdemServicoDTO> {
  const { data } = await api.get<OrdemServicoDTO>(`/ordens/${id}`);
  return data;
}

export async function criarOrdem(input: OrdemInput): Promise<OrdemServicoDTO> {
  const { data } = await api.post<OrdemServicoDTO>("/ordens", input);
  return data;
}

export async function atualizarOrdem(id: string, input: Partial<OrdemInput & { desconto: number }>): Promise<OrdemServicoDTO> {
  const { data } = await api.patch<OrdemServicoDTO>(`/ordens/${id}`, input);
  return data;
}

export async function mudarStatusOrdem(id: string, status: StatusOS, observacao?: string): Promise<OrdemServicoDTO> {
  const { data } = await api.patch<OrdemServicoDTO>(`/ordens/${id}/status`, { status, observacao });
  return data;
}

export async function adicionarItem(ordemId: string, input: { pecaId: string; quantidade: number }): Promise<OrdemServicoDTO> {
  const { data } = await api.post<OrdemServicoDTO>(`/ordens/${ordemId}/itens`, input);
  return data;
}

export async function removerItem(ordemId: string, itemId: string): Promise<OrdemServicoDTO> {
  const { data } = await api.delete<OrdemServicoDTO>(`/ordens/${ordemId}/itens/${itemId}`);
  return data;
}

export async function adicionarServico(
  ordemId: string,
  input: { servicoId: string; valor?: number; observacao?: string }
): Promise<OrdemServicoDTO> {
  const { data } = await api.post<OrdemServicoDTO>(`/ordens/${ordemId}/servicos`, input);
  return data;
}

export async function removerServico(ordemId: string, servicoItemId: string): Promise<OrdemServicoDTO> {
  const { data } = await api.delete<OrdemServicoDTO>(`/ordens/${ordemId}/servicos/${servicoItemId}`);
  return data;
}
