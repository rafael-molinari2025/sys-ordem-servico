import { StatusOS, TRANSICOES_STATUS_OS } from "shared";
import { describe, expect, it } from "vitest";

describe("TRANSICOES_STATUS_OS — máquina de estados da OS", () => {
  it("segue o fluxo principal orçamento -> aprovação -> execução -> entrega", () => {
    expect(TRANSICOES_STATUS_OS[StatusOS.ORCAMENTO]).toContain(StatusOS.AGUARDANDO_APROVACAO);
    expect(TRANSICOES_STATUS_OS[StatusOS.AGUARDANDO_APROVACAO]).toContain(StatusOS.APROVADO);
    expect(TRANSICOES_STATUS_OS[StatusOS.AGUARDANDO_APROVACAO]).toContain(StatusOS.RECUSADO);
    expect(TRANSICOES_STATUS_OS[StatusOS.APROVADO]).toContain(StatusOS.EM_ANDAMENTO);
    expect(TRANSICOES_STATUS_OS[StatusOS.EM_ANDAMENTO]).toContain(StatusOS.CONCLUIDO);
    expect(TRANSICOES_STATUS_OS[StatusOS.CONCLUIDO]).toContain(StatusOS.ENTREGUE);
  });

  it("não permite pular etapas (ex.: orçamento direto para concluído)", () => {
    expect(TRANSICOES_STATUS_OS[StatusOS.ORCAMENTO]).not.toContain(StatusOS.CONCLUIDO);
    expect(TRANSICOES_STATUS_OS[StatusOS.ORCAMENTO]).not.toContain(StatusOS.EM_ANDAMENTO);
  });

  it("permite cancelar a partir de qualquer estado não-terminal", () => {
    const naoTerminais = [StatusOS.ORCAMENTO, StatusOS.AGUARDANDO_APROVACAO, StatusOS.APROVADO, StatusOS.EM_ANDAMENTO];
    for (const status of naoTerminais) {
      expect(TRANSICOES_STATUS_OS[status]).toContain(StatusOS.CANCELADO);
    }
  });

  it("trata RECUSADO, ENTREGUE e CANCELADO como estados terminais (sem transições)", () => {
    expect(TRANSICOES_STATUS_OS[StatusOS.RECUSADO]).toHaveLength(0);
    expect(TRANSICOES_STATUS_OS[StatusOS.ENTREGUE]).toHaveLength(0);
    expect(TRANSICOES_STATUS_OS[StatusOS.CANCELADO]).toHaveLength(0);
  });
});
