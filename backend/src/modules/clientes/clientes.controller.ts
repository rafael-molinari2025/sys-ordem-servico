import { Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "../../errors";
import * as clientesService from "./clientes.service";

const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  telefone: z.string().min(8, "Telefone inválido"),
  documento: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

const atualizarSchema = clienteSchema.partial().extend({ ativo: z.boolean().optional() });

export async function listarController(req: Request, res: Response) {
  const busca = typeof req.query.busca === "string" ? req.query.busca : undefined;
  res.json(await clientesService.listar(busca));
}

export async function buscarController(req: Request, res: Response) {
  res.json(await clientesService.buscarPorId(req.params.id));
}

export async function criarController(req: Request, res: Response) {
  const parsed = clienteSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.status(201).json(await clientesService.criar(parsed.data));
}

export async function atualizarController(req: Request, res: Response) {
  const parsed = atualizarSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.json(await clientesService.atualizar(req.params.id, parsed.data));
}

export async function removerController(req: Request, res: Response) {
  await clientesService.remover(req.params.id);
  res.status(204).send();
}

export async function historicoController(req: Request, res: Response) {
  res.json(await clientesService.historico(req.params.id));
}
