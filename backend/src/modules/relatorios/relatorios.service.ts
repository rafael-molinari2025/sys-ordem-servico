import { OrdemServicoDTO, PecaDTO, PerfilUsuario, StatusOS } from "shared";
import { prisma } from "../../lib/prisma";
import * as clientesService from "../clientes/clientes.service";
import * as ordensService from "../ordens/ordens.service";
import { toPecaDTO } from "../estoque/pecas.service";

const STATUS_COM_RECEITA = [StatusOS.APROVADO, StatusOS.EM_ANDAMENTO, StatusOS.CONCLUIDO, StatusOS.ENTREGUE];

export interface FiltroPeriodo {
  inicio?: Date;
  fim?: Date;
}

export interface RelatorioOSData {
  filtros: FiltroPeriodo & { status?: StatusOS; clienteNome?: string };
  ordens: OrdemServicoDTO[];
  totalGeral: number;
}

export async function buildRelatorioOS(filtros: {
  inicio?: Date;
  fim?: Date;
  status?: StatusOS;
  clienteId?: string;
}): Promise<RelatorioOSData> {
  const ordens = await ordensService.listar(filtros);
  const cliente = filtros.clienteId ? await clientesService.buscarPorId(filtros.clienteId) : undefined;
  const totalGeral = ordens.reduce((acc, o) => acc + o.totais.total, 0);
  return {
    filtros: { inicio: filtros.inicio, fim: filtros.fim, status: filtros.status, clienteNome: cliente?.nome },
    ordens,
    totalGeral,
  };
}

export interface RelatorioFinanceiroData {
  filtros: FiltroPeriodo;
  quantidadeOS: number;
  totalPecas: number;
  totalServicos: number;
  totalGeral: number;
  ticketMedio: number;
  ordens: OrdemServicoDTO[];
}

/** Considera receita apenas OS que passaram da aprovação do cliente (orçamentos recusados/cancelados não entram). */
export async function buildRelatorioFinanceiro(filtros: { inicio?: Date; fim?: Date }): Promise<RelatorioFinanceiroData> {
  const todasOrdens = await ordensService.listar(filtros);
  const ordens = todasOrdens.filter((o) => STATUS_COM_RECEITA.includes(o.status));

  const totalPecas = ordens.reduce((acc, o) => acc + o.totais.totalPecas, 0);
  const totalServicos = ordens.reduce((acc, o) => acc + o.totais.totalServicos, 0);
  const totalGeral = ordens.reduce((acc, o) => acc + o.totais.total, 0);

  return {
    filtros,
    quantidadeOS: ordens.length,
    totalPecas,
    totalServicos,
    totalGeral,
    ticketMedio: ordens.length > 0 ? totalGeral / ordens.length : 0,
    ordens,
  };
}

export interface RelatorioEstoqueData {
  filtros: FiltroPeriodo;
  pecas: PecaDTO[];
  movimentacoes: {
    pecaNome: string;
    tipo: string;
    quantidade: number;
    saldoApos: number;
    motivo: string | null;
    usuarioNome: string | null;
    criadoEm: string;
  }[];
}

export async function buildRelatorioEstoque(filtros: { inicio?: Date; fim?: Date }): Promise<RelatorioEstoqueData> {
  const pecasRaw = await prisma.peca.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
  const pecas = pecasRaw.map((p) => toPecaDTO(p, PerfilUsuario.ADMIN));

  let movimentacoes: RelatorioEstoqueData["movimentacoes"] = [];
  if (filtros.inicio || filtros.fim) {
    const registros = await prisma.movimentacaoEstoque.findMany({
      where: { criadoEm: { gte: filtros.inicio, lte: filtros.fim } },
      include: { peca: { select: { nome: true } }, usuario: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
    });
    movimentacoes = registros.map((m) => ({
      pecaNome: m.peca.nome,
      tipo: m.tipo,
      quantidade: m.quantidade,
      saldoApos: m.saldoApos,
      motivo: m.motivo,
      usuarioNome: m.usuario?.nome ?? null,
      criadoEm: m.criadoEm.toISOString(),
    }));
  }

  return { filtros, pecas, movimentacoes };
}

export interface RelatorioClienteData {
  cliente: { nome: string; telefone: string };
  ordens: OrdemServicoDTO[];
  totalGasto: number;
}

export async function buildRelatorioCliente(clienteId: string): Promise<RelatorioClienteData> {
  const cliente = await clientesService.buscarPorId(clienteId);
  const ordens = await ordensService.listar({ clienteId });
  const totalGasto = ordens
    .filter((o) => STATUS_COM_RECEITA.includes(o.status))
    .reduce((acc, o) => acc + o.totais.total, 0);
  return { cliente: { nome: cliente.nome, telefone: cliente.telefone }, ordens, totalGasto };
}
