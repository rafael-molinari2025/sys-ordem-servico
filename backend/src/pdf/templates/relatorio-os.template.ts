import { EmpresaDTO, STATUS_OS_LABEL } from "shared";
import { RelatorioOSData } from "../../modules/relatorios/relatorios.service";
import { wrapInLayout } from "./layout";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function renderRelatorioOSHtml(data: RelatorioOSData, empresa: EmpresaDTO): string {
  const linhas = data.ordens.length
    ? data.ordens
        .map(
          (o) => `<tr>
            <td>#${o.numero}</td>
            <td>${o.cliente.nome}</td>
            <td>${o.itemDescricao}</td>
            <td>${STATUS_OS_LABEL[o.status]}</td>
            <td>${formatarData(o.dataAbertura)}</td>
            <td>${formatarMoeda(o.totais.total)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Nenhuma OS encontrada para os filtros informados</td></tr>`;

  const body = `
    <div class="secao">
      <h3>Filtros aplicados</h3>
      <p>
        ${data.filtros.inicio ? `De ${formatarData(data.filtros.inicio.toISOString())} ` : ""}
        ${data.filtros.fim ? `até ${formatarData(data.filtros.fim.toISOString())} ` : ""}
        ${data.filtros.status ? `— Status: ${STATUS_OS_LABEL[data.filtros.status]} ` : ""}
        ${data.filtros.clienteNome ? `— Cliente: ${data.filtros.clienteNome}` : ""}
        ${!data.filtros.inicio && !data.filtros.fim && !data.filtros.status && !data.filtros.clienteNome ? "Nenhum (todas as OS)" : ""}
      </p>
    </div>
    <table>
      <thead><tr><th>OS</th><th>Cliente</th><th>Item</th><th>Status</th><th>Abertura</th><th>Total</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <div class="totais">
      <div class="total"><span>Total do período</span><span>${formatarMoeda(data.totalGeral)}</span></div>
    </div>
  `;

  return wrapInLayout("<h2>Relatório de Ordens de Serviço</h2>", body, empresa);
}
