import { Servico } from "@prisma/client";
import { ServicoDTO } from "shared";
import { NotFoundError } from "../../errors";
import { prisma } from "../../lib/prisma";
import { toMoneyNumber } from "../../utils/money";

function toDTO(s: Servico): ServicoDTO {
  return {
    id: s.id,
    nome: s.nome,
    descricao: s.descricao,
    precoPadrao: toMoneyNumber(s.precoPadrao),
    ativo: s.ativo,
  };
}

export interface ServicoInput {
  nome: string;
  descricao?: string;
  precoPadrao: number;
}

export async function listar(busca?: string): Promise<ServicoDTO[]> {
  const servicos = await prisma.servico.findMany({
    where: busca ? { nome: { contains: busca, mode: "insensitive" } } : undefined,
    orderBy: { nome: "asc" },
  });
  return servicos.map(toDTO);
}

export async function buscarPorId(id: string): Promise<ServicoDTO> {
  const servico = await prisma.servico.findUnique({ where: { id } });
  if (!servico) throw new NotFoundError("Serviço não encontrado");
  return toDTO(servico);
}

export async function criar(input: ServicoInput): Promise<ServicoDTO> {
  const servico = await prisma.servico.create({ data: input });
  return toDTO(servico);
}

export async function atualizar(id: string, input: Partial<ServicoInput & { ativo: boolean }>): Promise<ServicoDTO> {
  const existente = await prisma.servico.findUnique({ where: { id } });
  if (!existente) throw new NotFoundError("Serviço não encontrado");
  const servico = await prisma.servico.update({ where: { id }, data: input });
  return toDTO(servico);
}

export async function remover(id: string): Promise<void> {
  const existente = await prisma.servico.findUnique({ where: { id } });
  if (!existente) throw new NotFoundError("Serviço não encontrado");
  await prisma.servico.update({ where: { id }, data: { ativo: false } });
}
