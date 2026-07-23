import { Prisma, TipoMovimentacao as PrismaTipoMovimentacao } from "@prisma/client";
import { MovimentacaoEstoqueDTO, TipoMovimentacao } from "shared";
import { EstoqueInsuficienteError, NotFoundError } from "../../errors";
import { prisma } from "../../lib/prisma";

type TxClient = Prisma.TransactionClient;

interface AplicarMovimentacaoInput {
  pecaId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string;
  ordemServicoId?: string;
  usuarioId?: string;
}

/**
 * Aplica uma movimentação de estoque dentro de uma transação já aberta pelo chamador
 * (usado tanto por ajustes manuais quanto pelo fluxo de consumo de peças em OS).
 * ENTRADA/SAIDA recebem quantidade sempre positiva (o sinal é implícito pelo tipo).
 * AJUSTE recebe a variação diretamente (pode ser positiva ou negativa) — usado para
 * corrigir divergências de contagem física de estoque.
 */
export async function aplicarMovimentacao(tx: TxClient, input: AplicarMovimentacaoInput) {
  const peca = await tx.peca.findUnique({ where: { id: input.pecaId } });
  if (!peca) throw new NotFoundError("Peça não encontrada");

  let delta: number;
  if (input.tipo === TipoMovimentacao.ENTRADA) delta = Math.abs(input.quantidade);
  else if (input.tipo === TipoMovimentacao.SAIDA) delta = -Math.abs(input.quantidade);
  else delta = input.quantidade; // AJUSTE: variação explícita

  const novaQuantidade = peca.quantidade + delta;
  if (novaQuantidade < 0) {
    throw new EstoqueInsuficienteError(peca.nome, peca.quantidade);
  }

  const pecaAtualizada = await tx.peca.update({ where: { id: peca.id }, data: { quantidade: novaQuantidade } });

  await tx.movimentacaoEstoque.create({
    data: {
      pecaId: peca.id,
      tipo: input.tipo as PrismaTipoMovimentacao,
      quantidade: Math.abs(delta),
      saldoApos: novaQuantidade,
      motivo: input.motivo,
      ordemServicoId: input.ordemServicoId,
      usuarioId: input.usuarioId,
    },
  });

  return pecaAtualizada;
}

/** Registro de movimentação manual (fora do fluxo de uma OS) — compra de fornecedor, perda, correção de contagem. */
export async function registrarMovimentacaoManual(input: AplicarMovimentacaoInput) {
  return prisma.$transaction((tx) => aplicarMovimentacao(tx, input));
}

export async function listarMovimentacoes(pecaId: string): Promise<MovimentacaoEstoqueDTO[]> {
  const peca = await prisma.peca.findUnique({ where: { id: pecaId } });
  if (!peca) throw new NotFoundError("Peça não encontrada");

  const movimentacoes = await prisma.movimentacaoEstoque.findMany({
    where: { pecaId },
    orderBy: { criadoEm: "desc" },
    include: { usuario: { select: { nome: true } } },
  });

  return movimentacoes.map((m) => ({
    id: m.id,
    pecaId: m.pecaId,
    tipo: m.tipo as TipoMovimentacao,
    quantidade: m.quantidade,
    saldoApos: m.saldoApos,
    motivo: m.motivo,
    ordemServicoId: m.ordemServicoId,
    usuarioNome: m.usuario?.nome ?? null,
    criadoEm: m.criadoEm.toISOString(),
  }));
}
