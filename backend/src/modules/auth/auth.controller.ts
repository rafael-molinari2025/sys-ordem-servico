import { Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "../../errors";
import * as authService from "./auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
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
