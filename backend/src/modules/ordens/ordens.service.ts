import { Prisma } from "@prisma/client";
import { OrdemServicoDTO, StatusOS, TotaisOSDTO, TRANSICOES_STATUS_OS } from "shared";
import { ConflictError, NotFoundError, TransicaoInvalidaError } from "../../errors";
import { prisma } from "../../lib/prisma";
import { sumMoney, toMoneyNumber } from "../../utils/money";

const includeCompleto = {
  cliente: { select: { id: true, nome: true, telefone: true } },
  responsavel: { select: { nome: true } },
  itens: { include: { peca: { select: { nome: true } } } },
  servicosRealizados: { include: { servico: { select: { nome: true } } } },
} satisfies Prisma.OrdemServicoInclude;

type OrdemComRelacoes = Prisma.OrdemServicoGetPayload<{ include: typeof includeCompleto }>;

/** Estados em que a lista de peças/serviços da OS ainda pode ser alterada. */
const STATUS_EDITAVEIS = [StatusOS.ORCAMENTO, StatusOS.APROVADO, StatusOS.EM_ANDAMENTO];

function calcularTotais(ordem: OrdemComRelacoes): TotaisOSDTO {
  const totalPecas = sumMoney(ordem.itens.map((i) => i.precoUnitario.mul(i.quantidade)));
  const totalServicos = sumMoney(ordem.servicosRealizados.map((s) => s.valor));
  const subtotal = totalPecas.plus(totalServicos);
  const total = Prisma.Decimal.max(0, subtotal.minus(ordem.desconto));
  return {
    totalPecas: toMoneyNumber(totalPecas),
    totalServicos: toMoneyNumber(totalServicos),
    subtotal: toMoneyNumber(subtotal),
    desconto: toMoneyNumber(ordem.desconto),
    total: toMoneyNumber(total),
  };
}

function toDTO(ordem: OrdemComRelacoes): OrdemServicoDTO {
  return {
    id: ordem.id,
    numero: ordem.numero,
    cliente: ordem.cliente,
    itemDescricao: ordem.itemDescricao,
    itemMarca: ordem.itemMarca,
    itemModelo: ordem.itemModelo,
    itemNumeroSerie: ordem.itemNumeroSerie,
    status: ordem.status as StatusOS,
    responsavelNome: ordem.responsavel?.nome ?? null,
    desconto: toMoneyNumber(ordem.desconto),
    observacoes: ordem.observacoes,
    dataAbertura: ordem.dataAbertura.toISOString(),
    dataPrevisao: ordem.dataPrevisao?.toISOString() ?? null,
    dataConclusao: ordem.dataConclusao?.toISOString() ?? null,
    dataEntrega: ordem.dataEntrega?.toISOString() ?? null,
    itens: ordem.itens.map((i) => ({
      id: i.id,
      pecaId: i.pecaId,
      pecaNome: i.peca.nome,
      quantidade: i.quantidade,
      precoUnitario: toMoneyNumber(i.precoUnitario),
    })),
    servicosRealizados: ordem.servicosRealizados.map((s) => ({
      id: s.id,
      servicoId: s.servicoId,
      servicoNome: s.servico.nome,
      valor: toMoneyNumber(s.valor),
      observacao: s.observacao,
    })),
    totais: calcularTotais(ordem),
  };
}

export interface OrdemInput {
  clienteId: string;
  itemDescricao: string;
  itemMarca?: string;
  itemModelo?: string;
  itemNumeroSerie?: string;
  responsavelId?: string;
  observacoes?: string;
  dataPrevisao?: string;
}

export async function listar(filtros: {
  status?: StatusOS;
  clienteId?: string;
  inicio?: Date;
  fim?: Date;
}): Promise<OrdemServicoDTO[]> {
  const ordens = await prisma.ordemServico.findMany({
    where: {
      status: filtros.status,
      clienteId: filtros.clienteId,
      dataAbertura: filtros.inicio || filtros.fim ? { gte: filtros.inicio, lte: filtros.fim } : undefined,
    },
    include: includeCompleto,
    orderBy: { dataAbertura: "desc" },
  });
  return ordens.map(toDTO);
}

async function buscarOrdemOuFalhar(id: string): Promise<OrdemComRelacoes> {
  const ordem = await prisma.ordemServico.findUnique({ where: { id }, include: includeCompleto });
  if (!ordem) throw new NotFoundError("Ordem de serviço não encontrada");
  return ordem;
}

export async function buscarPorId(id: string): Promise<OrdemServicoDTO> {
  return toDTO(await buscarOrdemOuFalhar(id));
}

export async function criar(input: OrdemInput, usuarioId: string): Promise<OrdemServicoDTO> {
  const ordem = await prisma.ordemServico.create({
    data: {
      clienteId: input.clienteId,
      itemDescricao: input.itemDescricao,
      itemMarca: input.itemMarca,
      itemModelo: input.itemModelo,
      itemNumeroSerie: input.itemNumeroSerie,
      responsavelId: input.responsavelId ?? usuarioId,
      observacoes: input.observacoes,
      dataPrevisao: input.dataPrevisao ? new Date(input.dataPrevisao) : undefined,
      historicoStatus: { create: [{ statusNovo: StatusOS.ORCAMENTO, usuarioId }] },
    },
    include: includeCompleto,
  });
  return toDTO(ordem);
}

export async function atualizar(
  id: string,
  input: Partial<OrdemInput & { desconto: number }>
): Promise<OrdemServicoDTO> {
  const existente = await buscarOrdemOuFalhar(id);
  if (!STATUS_EDITAVEIS.includes(existente.status as StatusOS)) {
    throw new ConflictError(`Não é possível editar uma OS com status "${existente.status}"`);
  }
  const ordem = await prisma.ordemServico.update({
    where: { id },
    data: {
      itemDescricao: input.itemDescricao,
      itemMarca: input.itemMarca,
      itemModelo: input.itemModelo,
      itemNumeroSerie: input.itemNumeroSerie,
      responsavelId: input.responsavelId,
      observacoes: input.observacoes,
      desconto: input.desconto,
      dataPrevisao: input.dataPrevisao ? new Date(input.dataPrevisao) : undefined,
    },
    include: includeCompleto,
  });
  return toDTO(ordem);
}

export async function mudarStatus(
  id: string,
  novoStatus: StatusOS,
  usuarioId: string | null,
  observacao?: string
): Promise<OrdemServicoDTO> {
  const existente = await buscarOrdemOuFalhar(id);
  const statusAtual = existente.status as StatusOS;
  const transicoesPermitidas = TRANSICOES_STATUS_OS[statusAtual];
  if (!transicoesPermitidas.includes(novoStatus)) {
    throw new TransicaoInvalidaError(statusAtual, novoStatus);
  }

  const agora = new Date();
  const ordem = await prisma.$transaction(async (tx) => {
    const atualizada = await tx.ordemServico.update({
      where: { id },
      data: {
        status: novoStatus,
        dataConclusao: novoStatus === StatusOS.CONCLUIDO ? agora : undefined,
        dataEntrega: novoStatus === StatusOS.ENTREGUE ? agora : undefined,
      },
      include: includeCompleto,
    });
    await tx.statusHistorico.create({
      data: { ordemServicoId: id, statusAnterior: statusAtual, statusNovo: novoStatus, usuarioId, observacao },
    });
    return atualizada;
  });

  return toDTO(ordem);
}

export function podeEditarItens(status: string): boolean {
  return (STATUS_EDITAVEIS as string[]).includes(status);
}

export { includeCompleto, toDTO, buscarOrdemOuFalhar };
