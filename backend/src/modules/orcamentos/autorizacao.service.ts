import { AutorizacaoPublicaDTO, DecisaoOrcamento, StatusOS } from "shared";
import { ConflictError, NotFoundError } from "../../errors";
import { prisma } from "../../lib/prisma";
import { generateToken } from "../../utils/tokens";
import * as ordensService from "../ordens/ordens.service";

const QUINZE_DIAS_MS = 15 * 24 * 60 * 60 * 1000;

/** Retorna um token de autorização ativo (não expirado, não decidido) para a OS, criando um novo se necessário. */
export async function gerarOuRenovarToken(ordemServicoId: string): Promise<string> {
  const agora = new Date();
  const existente = await prisma.orcamentoAutorizacao.findFirst({
    where: {
      ordemServicoId,
      decisao: null,
      OR: [{ expiraEm: null }, { expiraEm: { gt: agora } }],
    },
    orderBy: { criadoEm: "desc" },
  });
  if (existente) return existente.token;

  const criado = await prisma.orcamentoAutorizacao.create({
    data: {
      ordemServicoId,
      token: generateToken(),
      expiraEm: new Date(Date.now() + QUINZE_DIAS_MS),
    },
  });
  return criado.token;
}

async function buscarAutorizacaoOuFalhar(token: string) {
  const autorizacao = await prisma.orcamentoAutorizacao.findUnique({ where: { token } });
  if (!autorizacao) throw new NotFoundError("Link de autorização inválido");
  return autorizacao;
}

export async function validarToken(token: string): Promise<AutorizacaoPublicaDTO> {
  const autorizacao = await buscarAutorizacaoOuFalhar(token);
  const ordem = await ordensService.buscarPorId(autorizacao.ordemServicoId);
  const expirado = autorizacao.expiraEm !== null && autorizacao.expiraEm < new Date();

  return {
    numero: ordem.numero,
    clienteNome: ordem.cliente.nome,
    itemDescricao: ordem.itemDescricao,
    itens: ordem.itens.map((i) => ({ descricao: i.pecaNome, quantidade: i.quantidade, valorUnitario: i.precoUnitario })),
    servicos: ordem.servicosRealizados.map((s) => ({ descricao: s.servicoNome, valor: s.valor })),
    totais: ordem.totais,
    status: ordem.status,
    decisao: autorizacao.decisao as DecisaoOrcamento | null,
    decididoEm: autorizacao.decididoEm?.toISOString() ?? null,
    expirado,
  };
}

export async function decidir(token: string, decisao: DecisaoOrcamento, ip?: string): Promise<AutorizacaoPublicaDTO> {
  const autorizacao = await buscarAutorizacaoOuFalhar(token);

  const expirado = autorizacao.expiraEm !== null && autorizacao.expiraEm < new Date();
  if (expirado) throw new ConflictError("Este link de autorização expirou");
  if (autorizacao.decisao !== null) throw new ConflictError("Este orçamento já foi decidido anteriormente");

  await prisma.orcamentoAutorizacao.update({
    where: { token },
    data: { decisao, decididoEm: new Date(), ipDecisao: ip },
  });

  await ordensService.mudarStatus(
    autorizacao.ordemServicoId,
    decisao as unknown as StatusOS,
    null,
    "Decisão do cliente via link público de autorização"
  );

  return validarToken(token);
}
