import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginResponse, UsuarioDTO, ValidarTokenRedefinicaoDTO } from "shared";
import { env, frontendUrlPrincipal } from "../../config/env";
import { ConflictError, UnauthorizedError } from "../../errors";
import { prisma } from "../../lib/prisma";
import { AuthPayload } from "../../middleware/auth.middleware";
import { generateToken } from "../../utils/tokens";
import { logger } from "../../lib/logger";
import * as whatsappService from "../whatsapp/whatsapp.service";

const TRINTA_MINUTOS_MS = 30 * 60 * 1000;

function toUsuarioDTO(usuario: {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: string;
  ativo: boolean;
}): UsuarioDTO {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
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

/**
 * Nunca revela ao chamador se o e-mail existe, se o usuário tem telefone cadastrado ou se o
 * WhatsApp está conectado — sempre retorna silenciosamente, só loga falhas no servidor. Isso
 * evita que a rota pública sirva de oráculo para enumerar contas existentes no sistema.
 */
export async function solicitarRedefinicao(email: string): Promise<void> {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) return;

  if (!usuario.telefone) {
    logger.warn(`Redefinição de senha solicitada para ${email}, mas o usuário não tem telefone cadastrado.`);
    return;
  }

  const token = generateToken();
  await prisma.redefinicaoSenha.create({
    data: { usuarioId: usuario.id, token, expiraEm: new Date(Date.now() + TRINTA_MINUTOS_MS) },
  });

  const link = `${frontendUrlPrincipal}/redefinir-senha/${token}`;
  const mensagem = `Olá, ${usuario.nome}! Recebemos uma solicitação para redefinir sua senha do Sistema de Ordem de Serviço. Se foi você, clique no link abaixo (válido por 30 minutos):`;

  try {
    await whatsappService.sendTexto(usuario.telefone, `${mensagem}\n\n${link}`);
  } catch (err) {
    logger.error(`Falha ao enviar link de redefinição de senha para ${email}:`, err);
  }
}

async function buscarRedefinicaoOuFalhar(token: string) {
  const redefinicao = await prisma.redefinicaoSenha.findUnique({ where: { token } });
  if (!redefinicao) return null;
  const expirado = redefinicao.expiraEm < new Date();
  if (expirado || redefinicao.usadoEm) return null;
  return redefinicao;
}

export async function validarTokenRedefinicao(token: string): Promise<ValidarTokenRedefinicaoDTO> {
  const redefinicao = await buscarRedefinicaoOuFalhar(token);
  return { valido: redefinicao !== null };
}

export async function redefinirSenha(token: string, novaSenha: string): Promise<void> {
  const redefinicao = await buscarRedefinicaoOuFalhar(token);
  if (!redefinicao) throw new ConflictError("Este link de redefinição é inválido ou expirou");

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.$transaction([
    prisma.usuario.update({ where: { id: redefinicao.usuarioId }, data: { senhaHash } }),
    prisma.redefinicaoSenha.update({ where: { token }, data: { usadoEm: new Date() } }),
  ]);
}
