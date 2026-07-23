import { Request, Response } from "express";
import * as orcamentosService from "./orcamentos.service";

export async function gerarPdfController(req: Request, res: Response) {
  const pdf = await orcamentosService.gerarPdfOrcamento(req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="orcamento-os-${req.params.id}.pdf"`);
  res.send(pdf);
}

export async function enviarWhatsAppController(req: Request, res: Response) {
  await orcamentosService.enviarOrcamentoPorWhatsApp(req.params.id, req.user!.sub);
  res.status(204).send();
}
