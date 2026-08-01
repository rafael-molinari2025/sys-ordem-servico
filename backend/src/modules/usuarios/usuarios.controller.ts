import { Request, Response } from "express";
import { z } from "zod";
import { PerfilUsuario } from "shared";
import { ValidationError } from "../../errors";
import * as usuariosService from "./usuarios.service";

const criarSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().optional(),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  perfil: z.nativeEnum(PerfilUsuario, { errorMap: () => ({ message: "Perfil inválido" }) }),
});

const atualizarSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  telefone: z.string().optional(),
  perfil: z.nativeEnum(PerfilUsuario, { errorMap: () => ({ message: "Perfil inválido" }) }).optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres").optional(),
});

export async function listarController(_req: Request, res: Response) {
  res.json(await usuariosService.listar());
}

export async function criarController(req: Request, res: Response) {
  const parsed = criarSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.status(201).json(await usuariosService.criar(parsed.data));
}

export async function atualizarController(req: Request, res: Response) {
  const parsed = atualizarSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  res.json(await usuariosService.atualizar(req.params.id, parsed.data));
}

export async function removerController(req: Request, res: Response) {
  await usuariosService.remover(req.params.id);
  res.status(204).send();
}
