import { LoginRequest, LoginResponse, UsuarioDTO } from "shared";
import { api } from "./client";

export async function login(input: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", input);
  return data;
}

export async function me(): Promise<UsuarioDTO> {
  const { data } = await api.get<UsuarioDTO>("/auth/me");
  return data;
}
