import { EmpresaDTO } from "shared";
import { RelatorioEstoqueData } from "../../modules/relatorios/relatorios.service";
import { wrapInLayout } from "./layout";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

const TIPO_LABEL: Record<string, string> = { ENTRADA: "Entrada", SAIDA: "Saída", AJUSTE: "Ajuste" };

export function renderRelatorioEstoqueHtml(data: RelatorioEstoqueData, empresa: EmpresaDTO): string {
  const linhasPecas = data.pecas
    .map(
      (p) => `<tr style="${p.quantidade <= p.estoqueMinimo ? "color:#b45309;font-weight:bold;" : ""}">
        <td>${p.nome}</td>
        <td>${p.sku}</td>
        <td>${p.quantidade}</td>
        <td>${p.estoqueMinimo}</td>
        <td>${formatarMoeda(p.precoVenda)}</td>
        <td>${p.quantidade <= p.estoqueMinimo ? "Estoque baixo" : ""}</td>
      </tr>`
    )
    .join("");

  const linhasMovimentacoes = data.movimentacoes.length
    ? data.movimentacoes
        .map(
          (m) => `<tr>
            <td>${formatarDataHora(m.criadoEm)}</td>
            <td>${m.pecaNome}</td>
            <td>${TIPO_LABEL[m.tipo] ?? m.tipo}</td>
            <td>${m.quantidade}</td>
            <td>${m.saldoApos}</td>
            <td>${m.motivo ?? ""}</td>
            <td>${m.usuarioNome ?? ""}</td>
          </tr>`
        )
        .join("")
    : "";

  const body = `
    <div class="secao">
      <h3>Estoque atual</h3>
      <table>
        <thead><tr><th>Peça</th><th>SKU</th><th>Qtd.</th><th>Mínimo</th><th>Venda</th><th>Alerta</th></tr></thead>
        <tbody>${linhasPecas}</tbody>
      </table>
    </div>

    ${
      data.movimentacoes.length > 0
        ? `<div class="secao">
             <h3>Movimentações no período</h3>
             <table>
               <thead><tr><th>Data</th><th>Peça</th><th>Tipo</th><th>Qtd.</th><th>Saldo após</th><th>Motivo</th><th>Usuário</th></tr></thead>
               <tbody>${linhasMovimentacoes}</tbody>
             </table>
           </div>`
        : ""
    }
  `;

  return wrapInLayout("<h2>Relatório de Estoque</h2>", body, empresa);
}
