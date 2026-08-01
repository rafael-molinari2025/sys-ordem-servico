import { Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "../../errors";
import * as authService from "./auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

const esqueciSenhaSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const redefinirSenhaSchema = z.object({
  novaSenha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export async function loginController(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError("E-mail e senha são obrigatórios");
  const result = await authService.login(parsed.data.email, parsed.data.senha);
  res.json(result);
}

export async function meController(req: Request, res: Response) {
  const usuario = await authService.me(req.user!.sub);
  res.json(usuario);
}

export async function esqueciSenhaController(req: Request, res: Response) {
  const parsed = esqueciSenhaSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError("E-mail inválido");
  await authService.solicitarRedefinicao(parsed.data.email);
  res.json({ mensagem: "Se o e-mail existir e tiver um telefone cadastrado, você receberá um link por WhatsApp." });
}

export async function validarTokenRedefinicaoController(req: Request, res: Response) {
  res.json(await authService.validarTokenRedefinicao(req.params.token));
}

export async function redefinirSenhaController(req: Request, res: Response) {
  const parsed = redefinirSenhaSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message);
  await authService.redefinirSenha(req.params.token, parsed.data.novaSenha);
  res.json({ mensagem: "Senha redefinida com sucesso." });
}
