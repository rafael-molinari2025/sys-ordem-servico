import { TipoMovimentacao } from "shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EstoqueInsuficienteError } from "../../src/errors";
import { prisma } from "../../src/lib/prisma";
import { aplicarMovimentacao } from "../../src/modules/estoque/movimentacao.service";

describe("movimentacao.service", () => {
  let pecaId: string;

  beforeEach(async () => {
    const peca = await prisma.peca.create({
      data: {
        nome: "Peça de teste",
        sku: `TEST-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        quantidade: 10,
        precoCusto: 5,
        precoVenda: 10,
        estoqueMinimo: 2,
      },
    });
    pecaId = peca.id;
  });

  afterEach(async () => {
    await prisma.movimentacaoEstoque.deleteMany({ where: { pecaId } });
    await prisma.peca.delete({ where: { id: pecaId } });
  });

  it("decrementa o estoque numa SAIDA e grava o saldo resultante", async () => {
    const pecaAtualizada = await prisma.$transaction((tx) =>
      aplicarMovimentacao(tx, { pecaId, tipo: TipoMovimentacao.SAIDA, quantidade: 4 })
    );
    expect(pecaAtualizada.quantidade).toBe(6);

    const movimentacoes = await prisma.movimentacaoEstoque.findMany({ where: { pecaId } });
    expect(movimentacoes).toHaveLength(1);
    expect(movimentacoes[0].tipo).toBe("SAIDA");
    expect(movimentacoes[0].quantidade).toBe(4);
    expect(movimentacoes[0].saldoApos).toBe(6);
  });

  it("incrementa o estoque numa ENTRADA", async () => {
    const pecaAtualizada = await prisma.$transaction((tx) =>
      aplicarMovimentacao(tx, { pecaId, tipo: TipoMovimentacao.ENTRADA, quantidade: 5 })
    );
    expect(pecaAtualizada.quantidade).toBe(15);
  });

  it("aplica a variação diretamente num AJUSTE (pode ser negativo)", async () => {
    const pecaAtualizada = await prisma.$transaction((tx) =>
      aplicarMovimentacao(tx, { pecaId, tipo: TipoMovimentacao.AJUSTE, quantidade: -3 })
    );
    expect(pecaAtualizada.quantidade).toBe(7);
  });

  it("rejeita uma SAIDA que deixaria o estoque negativo", async () => {
    await expect(
      prisma.$transaction((tx) => aplicarMovimentacao(tx, { pecaId, tipo: TipoMovimentacao.SAIDA, quantidade: 999 }))
    ).rejects.toBeInstanceOf(EstoqueInsuficienteError);

    const peca = await prisma.peca.findUniqueOrThrow({ where: { id: pecaId } });
    expect(peca.quantidade).toBe(10);
  });
});
