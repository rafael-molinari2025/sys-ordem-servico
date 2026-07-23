import { Request, Response } from "express";
import { z } from "zod";
import { StatusOS } from "shared";
import { ValidationError } from "../../errors";
import * as ordensService from "./ordens.service";
import * as itensService from "./ordens.itens.service";
import * as servicosService from "./ordens.servicos.service";

const criarSchema = z.object({
  clienteId: z.string().min(1, "Cliente é obrigatório"),
  itemDescricao: z.string().min(1, "Descrição do item é obrigatória"),
  itemMarca: z.string().optional(),
  itemModelo: z.string().optional(),
  itemNumeroSerie: z.string().optional(),
  responsavelId: z.string().optional(),
  observacoes: z.string().optional(),
  dataPrevisao: z.string().optional(),
});

const atualizarSchema = criarSchema.partial().extend({ desconto: z.number().min(0).optional() });

const statusSchema = z.object({
  status: z.nativeEnum(StatusOS),
  observacao: z.string().optional(),
});

const itemSchema = z.object({
  pecaId: z.string().min(1, "Peça é obrigatória"),
  quantidade: z.number().int().positive("Quantidade deve ser maior que zero"),
});

const servicoSchema = z.object({
  servicoId: z.string().min(1, "Serviço é obrigatório"),
  valor: z.number().min(0).optional(),
  observacao: z.string().optional(),
});

export async function listarController(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? (req.query.status as StatusOS) : undefined;
  const clienteId = typeof req.query.clienteId === "string" ? req.query.clienteId : undefined;
  res.json(await ordensService.listar({ status, clienteId }));
}

export async function buscarController(req: Request, res: Response) {
  res.json(await ordensService.buscarPorId(req.params.id));
}

export async function criarController(req: Request, res: Response) {
  const parsed = criarSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.status(201).json(await ordensService.criar(parsed.data, req.user!.sub));
}

export async function atualizarController(req: Request, res: Response) {
  const parsed = atualizarSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.json(await ordensService.atualizar(req.params.id, parsed.data));
}

export async function mudarStatusController(req: Request, res: Response) {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.json(await ordensService.mudarStatus(req.params.id, parsed.data.status, req.user!.sub, parsed.data.observacao));
}

export async function adicionarItemController(req: Request, res: Response) {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.status(201).json(await itensService.adicionarItem(req.params.id, parsed.data, req.user!.sub));
}

export async function removerItemController(req: Request, res: Response) {
  res.json(await itensService.removerItem(req.params.id, req.params.itemId, req.user!.sub));
}

export async function adicionarServicoController(req: Request, res: Response) {
  const parsed = servicoSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.status(201).json(await servicosService.adicionarServico(req.params.id, parsed.data));
}

export async function removerServicoController(req: Request, res: Response) {
  res.json(await servicosService.removerServico(req.params.id, req.params.servicoId));
}
