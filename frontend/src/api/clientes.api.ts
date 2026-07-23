import { ClienteDTO } from "shared";
import { api } from "./client";

export type ClienteInput = Omit<ClienteDTO, "id" | "ativo" | "criadoEm">;

export async function listarClientes(busca?: string): Promise<ClienteDTO[]> {
  const { data } = await api.get<ClienteDTO[]>("/clientes", { params: { busca } });
  return data;
}

export async function buscarCliente(id: string): Promise<ClienteDTO> {
  const { data } = await api.get<ClienteDTO>(`/clientes/${id}`);
  return data;
}

export async function criarCliente(input: ClienteInput): Promise<ClienteDTO> {
  const { data } = await api.post<ClienteDTO>("/clientes", input);
  return data;
}

export async function atualizarCliente(id: string, input: Partial<ClienteInput & { ativo: boolean }>): Promise<ClienteDTO> {
  const { data } = await api.patch<ClienteDTO>(`/clientes/${id}`, input);
  return data;
}

export async function removerCliente(id: string): Promise<void> {
  await api.delete(`/clientes/${id}`);
}
