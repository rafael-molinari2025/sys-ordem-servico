import { MovimentacaoEstoqueDTO, PecaDTO, TipoMovimentacao } from "shared";
import { api } from "./client";

export type PecaInput = Omit<PecaDTO, "id" | "ativo" | "precoCusto"> & { precoCusto: number };

export async function listarPecas(busca?: string): Promise<PecaDTO[]> {
  const { data } = await api.get<PecaDTO[]>("/pecas", { params: { busca } });
  return data;
}

export async function listarBaixoEstoque(): Promise<PecaDTO[]> {
  const { data } = await api.get<PecaDTO[]>("/pecas/baixo-estoque");
  return data;
}

export async function buscarPeca(id: string): Promise<PecaDTO> {
  const { data } = await api.get<PecaDTO>(`/pecas/${id}`);
  return data;
}

export async function criarPeca(input: PecaInput): Promise<PecaDTO> {
  const { data } = await api.post<PecaDTO>("/pecas", input);
  return data;
}

export async function atualizarPeca(id: string, input: Partial<PecaInput & { ativo: boolean }>): Promise<PecaDTO> {
  const { data } = await api.patch<PecaDTO>(`/pecas/${id}`, input);
  return data;
}

export async function removerPeca(id: string): Promise<void> {
  await api.delete(`/pecas/${id}`);
}

export async function listarMovimentacoes(pecaId: string): Promise<MovimentacaoEstoqueDTO[]> {
  const { data } = await api.get<MovimentacaoEstoqueDTO[]>(`/pecas/${pecaId}/movimentacoes`);
  return data;
}

export async function criarMovimentacao(
  pecaId: string,
  input: { tipo: TipoMovimentacao; quantidade: number; motivo?: string }
): Promise<PecaDTO> {
  const { data } = await api.post<PecaDTO>(`/pecas/${pecaId}/movimentacoes`, input);
  return data;
}
