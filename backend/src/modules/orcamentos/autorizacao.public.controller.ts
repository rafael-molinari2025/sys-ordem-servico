import { Request, Response } from "express";
import { z } from "zod";
import { DecisaoOrcamento } from "shared";
import { ValidationError } from "../../errors";
import * as autorizacaoService from "./autorizacao.service";

const decidirSchema = z.object({
  decisao: z.nativeEnum(DecisaoOrcamento),
});

export async function visualizarController(req: Request, res: Response) {
  res.json(await autorizacaoService.validarToken(req.params.token));
}

export async function decidirController(req: Request, res: Response) {
  const parsed = decidirSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError("Decisão inválida");
  const ip = req.ip;
  res.json(await autorizacaoService.decidir(req.params.token, parsed.data.decisao, ip));
}
