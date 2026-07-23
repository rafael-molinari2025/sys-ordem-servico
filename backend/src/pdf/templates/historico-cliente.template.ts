import { EmpresaDTO, STATUS_OS_LABEL } from "shared";
import { RelatorioClienteData } from "../../modules/relatorios/relatorios.service";
import { wrapInLayout } from "./layout";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function renderHistoricoClienteHtml(data: RelatorioClienteData, empresa: EmpresaDTO): string {
  const linhas = data.ordens.length
    ? data.ordens
        .map(
          (o) => `<tr>
            <td>#${o.numero}</td>
            <td>${o.itemDescricao}</td>
            <td>${STATUS_OS_LABEL[o.status]}</td>
            <td>${formatarData(o.dataAbertura)}</td>
            <td>${formatarMoeda(o.totais.total)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="5" style="text-align:center;color:#94a3b8;">Nenhuma OS registrada para este cliente</td></tr>`;

  const body = `
    <div class="secao info-cliente">
      <h3>Cliente</h3>
      <p><strong>${data.cliente.nome}</strong> — ${data.cliente.telefone}</p>
    </div>

    <table>
      <thead><tr><th>OS</th><th>Item</th><th>Status</th><th>Abertura</th><th>Total</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>

    <div class="totais">
      <div class="total"><span>Total já gasto (OS aprovadas)</span><span>${formatarMoeda(data.totalGasto)}</span></div>
    </div>
  `;

  return wrapInLayout("<h2>Histórico do Cliente</h2>", body, empresa);
}
