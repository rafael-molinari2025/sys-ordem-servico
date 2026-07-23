import { PerfilUsuario, UsuarioDTO } from "shared";
import { api } from "./client";

export interface UsuarioInput {
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
}

export async function listarUsuarios(): Promise<UsuarioDTO[]> {
  const { data } = await api.get<UsuarioDTO[]>("/usuarios");
  return data;
}

export async function criarUsuario(input: Required<UsuarioInput>): Promise<UsuarioDTO> {
  const { data } = await api.post<UsuarioDTO>("/usuarios", input);
  return data;
}

export async function atualizarUsuario(id: string, input: Partial<UsuarioInput & { ativo: boolean }>): Promise<UsuarioDTO> {
  const { data } = await api.patch<UsuarioDTO>(`/usuarios/${id}`, input);
  return data;
}

export async function removerUsuario(id: string): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}
