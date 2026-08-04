import { Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "../../errors";
import * as empresaService from "./empresa.service";

const atualizarSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  logoUrl: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/, "Logo deve ser uma imagem enviada pelo formulário")
    .optional()
    .or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cnpj: z.string().optional(),
});

export async function obterController(_req: Request, res: Response) {
  res.json(await empresaService.obter());
}

export async function atualizarController(req: Request, res: Response) {
  const parsed = atualizarSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.json(await empresaService.atualizar(parsed.data));
}
