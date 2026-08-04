import { Peca } from "@prisma/client";
import { PecaDTO, PerfilUsuario } from "shared";
import { ConflictError, NotFoundError } from "../../errors";
import { prisma } from "../../lib/prisma";
import { toMoneyNumber } from "../../utils/money";

/** Esconde o preço de custo de perfis sem permissão — a única porta de saída de dados de Peca deve passar por aqui. */
export function toPecaDTO(peca: Peca, perfil: PerfilUsuario): PecaDTO {
  return {
    id: peca.id,
    nome: peca.nome,
    sku: peca.sku,
    quantidade: peca.quantidade,
    sobEncomenda: peca.sobEncomenda,
    precoCusto: perfil === PerfilUsuario.ADMIN ? toMoneyNumber(peca.precoCusto) : undefined,
    precoVenda: toMoneyNumber(peca.precoVenda),
    estoqueMinimo: peca.estoqueMinimo,
    fornecedor: peca.fornecedor,
    ativo: peca.ativo,
  };
}

export interface PecaInput {
  nome: string;
  sku: string;
  quantidade: number;
  sobEncomenda?: boolean;
  precoCusto: number;
  precoVenda: number;
  estoqueMinimo: number;
  fornecedor?: string;
}

export async function listar(perfil: PerfilUsuario, busca?: string): Promise<PecaDTO[]> {
  const pecas = await prisma.peca.findMany({
    where: {
      ativo: true,
      ...(busca
        ? { OR: [{ nome: { contains: busca, mode: "insensitive" } }, { sku: { contains: busca, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { nome: "asc" },
  });
  return pecas.map((p) => toPecaDTO(p, perfil));
}

export async function baixoEstoque(perfil: PerfilUsuario): Promise<PecaDTO[]> {
  const pecas = await prisma.peca.findMany({ where: { ativo: true, sobEncomenda: false } });
  return pecas.filter((p) => p.quantidade <= p.estoqueMinimo).map((p) => toPecaDTO(p, perfil));
}

export async function buscarPorId(id: string, perfil: PerfilUsuario): Promise<PecaDTO> {
  const peca = await prisma.peca.findUnique({ where: { id } });
  if (!peca) throw new NotFoundError("Peça não encontrada");
  return toPecaDTO(peca, perfil);
}

export async function criar(input: PecaInput, perfil: PerfilUsuario): Promise<PecaDTO> {
  const existente = await prisma.peca.findUnique({ where: { sku: input.sku } });
  if (existente) throw new ConflictError("Já existe uma peça com este SKU");
  const peca = await prisma.peca.create({ data: input });
  return toPecaDTO(peca, perfil);
}

export async function atualizar(id: string, input: Partial<PecaInput & { ativo: boolean }>, perfil: PerfilUsuario): Promise<PecaDTO> {
  const existente = await prisma.peca.findUnique({ where: { id } });
  if (!existente) throw new NotFoundError("Peça não encontrada");
  const peca = await prisma.peca.update({ where: { id }, data: input });
  return toPecaDTO(peca, perfil);
}

export async function remover(id: string): Promise<void> {
  const existente = await prisma.peca.findUnique({ where: { id } });
  if (!existente) throw new NotFoundError("Peça não encontrada");
  await prisma.peca.update({ where: { id }, data: { ativo: false } });
}
