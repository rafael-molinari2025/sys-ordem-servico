import { ClienteDTO } from "shared";
import { NotFoundError } from "../../errors";
import { prisma } from "../../lib/prisma";

function toDTO(c: {
  id: string;
  nome: string;
  telefone: string;
  documento: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
  ativo: boolean;
  criadoEm: Date;
}): ClienteDTO {
  return {
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    documento: c.documento,
    email: c.email,
    endereco: c.endereco,
    observacoes: c.observacoes,
    ativo: c.ativo,
    criadoEm: c.criadoEm.toISOString(),
  };
}

export interface ClienteInput {
  nome: string;
  telefone: string;
  documento?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
}

export async function listar(busca?: string): Promise<ClienteDTO[]> {
  const clientes = await prisma.cliente.findMany({
    where: busca
      ? {
          OR: [
            { nome: { contains: busca, mode: "insensitive" } },
            { telefone: { contains: busca } },
            { documento: { contains: busca } },
          ],
        }
      : undefined,
    orderBy: { nome: "asc" },
  });
  return clientes.map(toDTO);
}

export async function buscarPorId(id: string): Promise<ClienteDTO> {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new NotFoundError("Cliente não encontrado");
  return toDTO(cliente);
}

export async function criar(input: ClienteInput): Promise<ClienteDTO> {
  const cliente = await prisma.cliente.create({ data: input });
  return toDTO(cliente);
}

export async function atualizar(id: string, input: Partial<ClienteInput & { ativo: boolean }>): Promise<ClienteDTO> {
  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente) throw new NotFoundError("Cliente não encontrado");
  const cliente = await prisma.cliente.update({ where: { id }, data: input });
  return toDTO(cliente);
}

export async function remover(id: string): Promise<void> {
  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente) throw new NotFoundError("Cliente não encontrado");
  // Preserva histórico de OS vinculadas — inativa em vez de apagar.
  await prisma.cliente.update({ where: { id }, data: { ativo: false } });
}

export async function historico(id: string) {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new NotFoundError("Cliente não encontrado");
  const ordens = await prisma.ordemServico.findMany({
    where: { clienteId: id },
    orderBy: { dataAbertura: "desc" },
    select: {
      id: true,
      numero: true,
      itemDescricao: true,
      status: true,
      dataAbertura: true,
      dataEntrega: true,
    },
  });
  return { cliente: toDTO(cliente), ordens };
}
