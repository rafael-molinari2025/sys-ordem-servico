import bcrypt from "bcryptjs";
import { PerfilUsuario, UsuarioDTO } from "shared";
import { ConflictError, NotFoundError } from "../../errors";
import { prisma } from "../../lib/prisma";

function toDTO(u: { id: string; nome: string; email: string; perfil: string; ativo: boolean }): UsuarioDTO {
  return { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil as PerfilUsuario, ativo: u.ativo };
}

export async function listar(): Promise<UsuarioDTO[]> {
  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: "asc" } });
  return usuarios.map(toDTO);
}

export async function criar(input: { nome: string; email: string; senha: string; perfil: PerfilUsuario }): Promise<UsuarioDTO> {
  const existente = await prisma.usuario.findUnique({ where: { email: input.email } });
  if (existente) throw new ConflictError("Já existe um usuário com este e-mail");
  const senhaHash = await bcrypt.hash(input.senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome: input.nome, email: input.email, senhaHash, perfil: input.perfil },
  });
  return toDTO(usuario);
}

export async function atualizar(
  id: string,
  input: Partial<{ nome: string; perfil: PerfilUsuario; ativo: boolean; senha: string }>
): Promise<UsuarioDTO> {
  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) throw new NotFoundError("Usuário não encontrado");
  const data: Record<string, unknown> = {
    nome: input.nome,
    perfil: input.perfil,
    ativo: input.ativo,
  };
  if (input.senha) {
    data.senhaHash = await bcrypt.hash(input.senha, 10);
  }
  const usuario = await prisma.usuario.update({ where: { id }, data });
  return toDTO(usuario);
}

export async function remover(id: string): Promise<void> {
  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) throw new NotFoundError("Usuário não encontrado");
  // Nunca apagar de fato — usuário pode estar referenciado em OS/movimentações antigas (auditoria).
  await prisma.usuario.update({ where: { id }, data: { ativo: false } });
}
