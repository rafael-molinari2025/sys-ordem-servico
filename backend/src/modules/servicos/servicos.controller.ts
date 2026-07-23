import { Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "../../errors";
import * as servicosService from "./servicos.service";

const servicoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  precoPadrao: z.number().min(0),
});

const atualizarSchema = servicoSchema.partial().extend({ ativo: z.boolean().optional() });

export async function listarController(req: Request, res: Response) {
  const busca = typeof req.query.busca === "string" ? req.query.busca : undefined;
  res.json(await servicosService.listar(busca));
}

export async function buscarController(req: Request, res: Response) {
  res.json(await servicosService.buscarPorId(req.params.id));
}

export async function criarController(req: Request, res: Response) {
  const parsed = servicoSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.status(201).json(await servicosService.criar(parsed.data));
}

export async function atualizarController(req: Request, res: Response) {
  const parsed = atualizarSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.json(await servicosService.atualizar(req.params.id, parsed.data));
}

export async function removerController(req: Request, res: Response) {
  await servicosService.remover(req.params.id);
  res.status(204).send();
}
