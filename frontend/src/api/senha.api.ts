import axios from "axios";
import { ValidarTokenRedefinicaoDTO } from "shared";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333/api",
});

export async function solicitarRedefinicao(email: string): Promise<void> {
  await publicApi.post("/auth/esqueci-senha", { email });
}

export async function validarTokenRedefinicao(token: string): Promise<ValidarTokenRedefinicaoDTO> {
  const { data } = await publicApi.get<ValidarTokenRedefinicaoDTO>(`/auth/redefinir-senha/${token}`);
  return data;
}

export async function redefinirSenha(token: string, novaSenha: string): Promise<void> {
  await publicApi.post(`/auth/redefinir-senha/${token}`, { novaSenha });
}
