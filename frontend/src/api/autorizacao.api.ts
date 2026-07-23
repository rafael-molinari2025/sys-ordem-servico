import axios from "axios";
import { AutorizacaoPublicaDTO, DecisaoOrcamento } from "shared";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333/api",
});

export async function buscarAutorizacao(token: string): Promise<AutorizacaoPublicaDTO> {
  const { data } = await publicApi.get<AutorizacaoPublicaDTO>(`/publico/autorizacao/${token}`);
  return data;
}

export async function decidirAutorizacao(token: string, decisao: DecisaoOrcamento): Promise<AutorizacaoPublicaDTO> {
  const { data } = await publicApi.post<AutorizacaoPublicaDTO>(`/publico/autorizacao/${token}/decidir`, { decisao });
  return data;
}
