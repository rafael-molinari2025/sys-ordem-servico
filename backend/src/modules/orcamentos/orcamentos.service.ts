import { StatusOS } from "shared";
import { frontendUrlPrincipal } from "../../config/env";
import { renderHtmlToPdf } from "../../pdf/pdf.engine";
import { renderOrcamentoHtml } from "../../pdf/templates/orcamento.template";
import * as empresaService from "../empresa/empresa.service";
import * as ordensService from "../ordens/ordens.service";
import * as whatsappService from "../whatsapp/whatsapp.service";
import { gerarOuRenovarToken } from "./autorizacao.service";

export async function gerarPdfOrcamento(ordemServicoId: string): Promise<Buffer> {
  const ordem = await ordensService.buscarPorId(ordemServicoId);
  const empresa = await empresaService.obter();
  const token = await gerarOuRenovarToken(ordemServicoId);
  const linkAutorizacao = `${frontendUrlPrincipal}/autorizacao/${token}`;
  const html = renderOrcamentoHtml(ordem, empresa, linkAutorizacao);
  return renderHtmlToPdf(html);
}

export async function enviarOrcamentoPorWhatsApp(ordemServicoId: string, usuarioId: string): Promise<void> {
  const ordem = await ordensService.buscarPorId(ordemServicoId);
  const empresa = await empresaService.obter();
  const token = await gerarOuRenovarToken(ordemServicoId);
  const linkAutorizacao = `${frontendUrlPrincipal}/autorizacao/${token}`;

  const html = renderOrcamentoHtml(ordem, empresa, linkAutorizacao);
  const pdfBuffer = await renderHtmlToPdf(html);

  const mensagem = `Olá, ${ordem.cliente.nome}! Segue o orçamento da OS #${ordem.numero} referente a "${ordem.itemDescricao}". Para aprovar ou recusar, acesse o link abaixo.`;

  await whatsappService.sendOrcamento(ordem.cliente.telefone, pdfBuffer, mensagem, linkAutorizacao);

  if (ordem.status === StatusOS.ORCAMENTO) {
    await ordensService.mudarStatus(ordemServicoId, StatusOS.AGUARDANDO_APROVACAO, usuarioId, "Orçamento enviado por WhatsApp");
  }
}
