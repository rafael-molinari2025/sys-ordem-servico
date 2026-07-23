import { Decimal } from "@prisma/client/runtime/library";
import { describe, expect, it } from "vitest";
import { toDTO } from "../../src/modules/ordens/ordens.service";

/** Constrói um objeto no formato retornado pelo Prisma (com relações) só com os campos que toDTO/calcularTotais usam. */
function ordemFake(overrides: {
  desconto: number;
  itens: { quantidade: number; precoUnitario: number }[];
  servicos: { valor: number }[];
}) {
  return {
    id: "os-fake",
    numero: 1,
    itemDescricao: "Item de teste",
    itemMarca: null,
    itemModelo: null,
    itemNumeroSerie: null,
    status: "ORCAMENTO",
    observacoes: null,
    dataAbertura: new Date(),
    dataPrevisao: null,
    dataConclusao: null,
    dataEntrega: null,
    desconto: new Decimal(overrides.desconto),
    cliente: { id: "cli-1", nome: "Cliente Teste", telefone: "5511999999999" },
    responsavel: null,
    itens: overrides.itens.map((i, idx) => ({
      id: `item-${idx}`,
      pecaId: `peca-${idx}`,
      quantidade: i.quantidade,
      precoUnitario: new Decimal(i.precoUnitario),
      peca: { nome: `Peça ${idx}` },
    })),
    servicosRealizados: overrides.servicos.map((s, idx) => ({
      id: `serv-${idx}`,
      servicoId: `catalogo-${idx}`,
      valor: new Decimal(s.valor),
      observacao: null,
      servico: { nome: `Serviço ${idx}` },
    })),
  } as unknown as Parameters<typeof toDTO>[0];
}

describe("ordens.service — cálculo de totais", () => {
  it("soma peças (quantidade x preço) e serviços corretamente", () => {
    const dto = toDTO(
      ordemFake({
        desconto: 0,
        itens: [
          { quantidade: 2, precoUnitario: 10 },
          { quantidade: 1, precoUnitario: 25.5 },
        ],
        servicos: [{ valor: 50 }, { valor: 30 }],
      })
    );

    expect(dto.totais.totalPecas).toBe(45.5); // 2*10 + 1*25.5
    expect(dto.totais.totalServicos).toBe(80);
    expect(dto.totais.subtotal).toBe(125.5);
    expect(dto.totais.total).toBe(125.5);
  });

  it("aplica o desconto sobre o subtotal", () => {
    const dto = toDTO(ordemFake({ desconto: 20, itens: [{ quantidade: 1, precoUnitario: 100 }], servicos: [] }));
    expect(dto.totais.subtotal).toBe(100);
    expect(dto.totais.total).toBe(80);
  });

  it("nunca deixa o total ficar negativo mesmo com desconto maior que o subtotal", () => {
    const dto = toDTO(ordemFake({ desconto: 999, itens: [{ quantidade: 1, precoUnitario: 50 }], servicos: [] }));
    expect(dto.totais.total).toBe(0);
  });

  it("retorna zero quando não há peças nem serviços", () => {
    const dto = toDTO(ordemFake({ desconto: 0, itens: [], servicos: [] }));
    expect(dto.totais).toEqual({ totalPecas: 0, totalServicos: 0, subtotal: 0, desconto: 0, total: 0 });
  });
});
