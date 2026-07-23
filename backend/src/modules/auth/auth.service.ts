import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginResponse, UsuarioDTO } from "shared";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../errors";
import { prisma } from "../../lib/prisma";
import { AuthPayload } from "../../middleware/auth.middleware";

function toUsuarioDTO(usuario: { id: string; nome: string; email: string; perfil: string; ativo: boolean }): UsuarioDTO {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil as UsuarioDTO["perfil"],
    ativo: usuario.ativo,
  };
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    throw new UnauthorizedError("E-mail ou senha inválidos");
  }
  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    throw new UnauthorizedError("E-mail ou senha inválidos");
  }
  const payload: AuthPayload = { sub: usuario.id, perfil: usuario.perfil as AuthPayload["perfil"] };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
  return { token, usuario: toUsuarioDTO(usuario) };
}

export async function me(usuarioId: string): Promise<UsuarioDTO> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new UnauthorizedError("Sessão inválida — faça login novamente");
  return toUsuarioDTO(usuario);
}
