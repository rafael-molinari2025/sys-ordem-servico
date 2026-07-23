import { EmpresaDTO } from "shared";
import { api } from "./client";

export interface EmpresaInput {
  nome: string;
  logoUrl?: string;
  telefone?: string;
  endereco?: string;
  cnpj?: string;
}

export async function obterEmpresa(): Promise<EmpresaDTO> {
  const { data } = await api.get<EmpresaDTO>("/empresa");
  return data;
}

export async function atualizarEmpresa(input: EmpresaInput): Promise<EmpresaDTO> {
  const { data } = await api.put<EmpresaDTO>("/empresa", input);
  return data;
}
