import { ServicoDTO } from "shared";
import { api } from "./client";

export type ServicoInput = Omit<ServicoDTO, "id" | "ativo">;

export async function listarServicos(busca?: string): Promise<ServicoDTO[]> {
  const { data } = await api.get<ServicoDTO[]>("/servicos", { params: { busca } });
  return data;
}

export async function criarServico(input: ServicoInput): Promise<ServicoDTO> {
  const { data } = await api.post<ServicoDTO>("/servicos", input);
  return data;
}

export async function atualizarServico(id: string, input: Partial<ServicoInput & { ativo: boolean }>): Promise<ServicoDTO> {
  const { data } = await api.patch<ServicoDTO>(`/servicos/${id}`, input);
  return data;
}

export async function removerServico(id: string): Promise<void> {
  await api.delete(`/servicos/${id}`);
}
