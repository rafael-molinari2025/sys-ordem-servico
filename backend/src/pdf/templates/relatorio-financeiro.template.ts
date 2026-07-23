import { EmpresaDTO } from "shared";
import { RelatorioFinanceiroData } from "../../modules/relatorios/relatorios.service";
import { wrapInLayout } from "./layout";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function renderRelatorioFinanceiroHtml(data: RelatorioFinanceiroData, empresa: EmpresaDTO): string {
  const linhas = data.ordens.length
    ? data.ordens
        .map(
          (o) => `<tr>
            <td>#${o.numero}</td>
            <td>${o.cliente.nome}</td>
            <td>${formatarData(o.dataAbertura)}</td>
            <td>${formatarMoeda(o.totais.totalPecas)}</td>
            <td>${formatarMoeda(o.totais.totalServicos)}</td>
            <td>${formatarMoeda(o.totais.total)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Nenhuma receita no período informado</td></tr>`;

  const body = `
    <div class="secao">
      <h3>Período</h3>
      <p>
        ${data.filtros.inicio ? `De ${formatarData(data.filtros.inicio.toISOString())} ` : "Desde o início "}
        ${data.filtros.fim ? `até ${formatarData(data.filtros.fim.toISOString())}` : "até hoje"}
      </p>
      <p style="color:#64748b;">Considera apenas OS aprovadas pelo cliente (orçamentos recusados/cancelados não entram).</p>
    </div>

    <div class="totais" style="margin-bottom:20px;">
      <div><span>Quantidade de OS</span><span>${data.quantidadeOS}</span></div>
      <div><span>Receita de peças</span><span>${formatarMoeda(data.totalPecas)}</span></div>
      <div><span>Receita de serviços</span><span>${formatarMoeda(data.totalServicos)}</span></div>
      <div><span>Ticket médio</span><span>${formatarMoeda(data.ticketMedio)}</span></div>
      <div class="total"><span>Total geral</span><span>${formatarMoeda(data.totalGeral)}</span></div>
    </div>

    <table>
      <thead><tr><th>OS</th><th>Cliente</th><th>Data</th><th>Peças</th><th>Serviços</th><th>Total</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
  `;

  return wrapInLayout("<h2>Relatório Financeiro</h2>", body, empresa);
}
