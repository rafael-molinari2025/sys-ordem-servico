import { Request, Response } from "express";
import { z } from "zod";
import { TipoMovimentacao } from "shared";
import { ValidationError } from "../../errors";
import * as pecasService from "./pecas.service";
import * as movimentacaoService from "./movimentacao.service";

const pecaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().min(1, "SKU é obrigatório"),
  quantidade: z.number().int().min(0).default(0),
  precoCusto: z.number().min(0),
  precoVenda: z.number().min(0),
  estoqueMinimo: z.number().int().min(0).default(0),
  fornecedor: z.string().optional(),
});

const atualizarSchema = pecaSchema.partial().extend({ ativo: z.boolean().optional() });

const movimentacaoSchema = z.object({
  tipo: z.nativeEnum(TipoMovimentacao),
  quantidade: z.number().int(),
  motivo: z.string().optional(),
});

export async function listarController(req: Request, res: Response) {
  const busca = typeof req.query.busca === "string" ? req.query.busca : undefined;
  res.json(await pecasService.listar(req.user!.perfil, busca));
}

export async function baixoEstoqueController(req: Request, res: Response) {
  res.json(await pecasService.baixoEstoque(req.user!.perfil));
}

export async function buscarController(req: Request, res: Response) {
  res.json(await pecasService.buscarPorId(req.params.id, req.user!.perfil));
}

export async function criarController(req: Request, res: Response) {
  const parsed = pecaSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.status(201).json(await pecasService.criar(parsed.data, req.user!.perfil));
}

export async function atualizarController(req: Request, res: Response) {
  const parsed = atualizarSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.json(await pecasService.atualizar(req.params.id, parsed.data, req.user!.perfil));
}

export async function removerController(req: Request, res: Response) {
  await pecasService.remover(req.params.id);
  res.status(204).send();
}

export async function listarMovimentacoesController(req: Request, res: Response) {
  res.json(await movimentacaoService.listarMovimentacoes(req.params.id));
}

export async function criarMovimentacaoController(req: Request, res: Response) {
  const parsed = movimentacaoSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  const peca = await movimentacaoService.registrarMovimentacaoManual({
    pecaId: req.params.id,
    ...parsed.data,
    usuarioId: req.user!.sub,
  });
  res.status(201).json(await pecasService.buscarPorId(peca.id, req.user!.perfil));
}
