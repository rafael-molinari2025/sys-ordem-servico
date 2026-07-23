import { EmpresaDTO, OrdemServicoDTO } from "shared";
import { wrapInLayout } from "./layout";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function renderOrcamentoHtml(ordem: OrdemServicoDTO, empresa: EmpresaDTO, linkAutorizacao?: string): string {
  const itensHtml = ordem.itens.length
    ? ordem.itens
        .map(
          (i) => `<tr>
            <td>${i.pecaNome}</td>
            <td>${i.quantidade}</td>
            <td>${formatarMoeda(i.precoUnitario)}</td>
            <td>${formatarMoeda(i.quantidade * i.precoUnitario)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Nenhuma peça</td></tr>`;

  const servicosHtml = ordem.servicosRealizados.length
    ? ordem.servicosRealizados
        .map(
          (s) => `<tr>
            <td>${s.servicoNome}</td>
            <td>${formatarMoeda(s.valor)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="2" style="text-align:center;color:#94a3b8;">Nenhum serviço</td></tr>`;

  const itemPartes = [ordem.itemMarca, ordem.itemModelo].filter(Boolean).join(" ");

  const body = `
    <div class="secao info-cliente">
      <h3>Cliente</h3>
      <p><strong>${ordem.cliente.nome}</strong> — ${ordem.cliente.telefone}</p>
      <p>Item/Equipamento: ${ordem.itemDescricao}${itemPartes ? ` (${itemPartes})` : ""}${
    ordem.itemNumeroSerie ? ` — nº série ${ordem.itemNumeroSerie}` : ""
  }</p>
      <p>OS nº ${ordem.numero} — aberta em ${formatarData(ordem.dataAbertura)}</p>
    </div>

    <div class="secao">
      <h3>Peças</h3>
      <table>
        <thead><tr><th>Descrição</th><th>Qtd.</th><th>Valor unit.</th><th>Subtotal</th></tr></thead>
        <tbody>${itensHtml}</tbody>
      </table>
    </div>

    <div class="secao">
      <h3>Serviços</h3>
      <table>
        <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
        <tbody>${servicosHtml}</tbody>
      </table>
    </div>

    <div class="totais">
      <div><span>Peças</span><span>${formatarMoeda(ordem.totais.totalPecas)}</span></div>
      <div><span>Serviços</span><span>${formatarMoeda(ordem.totais.totalServicos)}</span></div>
      <div><span>Subtotal</span><span>${formatarMoeda(ordem.totais.subtotal)}</span></div>
      <div><span>Desconto</span><span>${formatarMoeda(ordem.totais.desconto)}</span></div>
      <div class="total"><span>Total</span><span>${formatarMoeda(ordem.totais.total)}</span></div>
    </div>

    ${
      linkAutorizacao
        ? `<div class="secao" style="margin-top:24px;padding:12px;background:#f1f5f9;border-radius:6px;">
             <h3>Autorização</h3>
             <p>Para aprovar ou recusar este orçamento, acesse: <strong>${linkAutorizacao}</strong></p>
           </div>`
        : ""
    }
  `;

  return wrapInLayout(`<h2>Orçamento</h2><span>OS #${ordem.numero}</span>`, body, empresa);
}
