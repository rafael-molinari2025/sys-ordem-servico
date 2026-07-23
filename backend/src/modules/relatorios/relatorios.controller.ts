import { Request, Response } from "express";
import { StatusOS } from "shared";
import { renderHtmlToPdf } from "../../pdf/pdf.engine";
import { renderRelatorioOSHtml } from "../../pdf/templates/relatorio-os.template";
import { renderRelatorioFinanceiroHtml } from "../../pdf/templates/relatorio-financeiro.template";
import { renderRelatorioEstoqueHtml } from "../../pdf/templates/relatorio-estoque.template";
import { renderHistoricoClienteHtml } from "../../pdf/templates/historico-cliente.template";
import * as empresaService from "../empresa/empresa.service";
import * as relatoriosService from "./relatorios.service";

function parseData(valor: unknown): Date | undefined {
  if (typeof valor !== "string" || !valor) return undefined;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? undefined : data;
}

async function responderPdf(res: Response, nomeArquivo: string, html: string) {
  const pdf = await renderHtmlToPdf(html);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${nomeArquivo}"`);
  res.send(pdf);
}

export async function relatorioOSController(req: Request, res: Response) {
  const data = await relatoriosService.buildRelatorioOS({
    inicio: parseData(req.query.inicio),
    fim: parseData(req.query.fim),
    status: typeof req.query.status === "string" ? (req.query.status as StatusOS) : undefined,
    clienteId: typeof req.query.clienteId === "string" ? req.query.clienteId : undefined,
  });
  const empresa = await empresaService.obter();
  await responderPdf(res, "relatorio-os.pdf", renderRelatorioOSHtml(data, empresa));
}

export async function relatorioFinanceiroController(req: Request, res: Response) {
  const data = await relatoriosService.buildRelatorioFinanceiro({
    inicio: parseData(req.query.inicio),
    fim: parseData(req.query.fim),
  });
  const empresa = await empresaService.obter();
  await responderPdf(res, "relatorio-financeiro.pdf", renderRelatorioFinanceiroHtml(data, empresa));
}

export async function relatorioEstoqueController(req: Request, res: Response) {
  const data = await relatoriosService.buildRelatorioEstoque({
    inicio: parseData(req.query.inicio),
    fim: parseData(req.query.fim),
  });
  const empresa = await empresaService.obter();
  await responderPdf(res, "relatorio-estoque.pdf", renderRelatorioEstoqueHtml(data, empresa));
}

export async function relatorioClienteController(req: Request, res: Response) {
  const data = await relatoriosService.buildRelatorioCliente(req.params.clienteId);
  const empresa = await empresaService.obter();
  await responderPdf(res, "historico-cliente.pdf", renderHistoricoClienteHtml(data, empresa));
}
