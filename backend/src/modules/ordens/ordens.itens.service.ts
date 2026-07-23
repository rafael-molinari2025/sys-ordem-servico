import { OrdemServicoDTO, TipoMovimentacao } from "shared";
import { ConflictError, NotFoundError } from "../../errors";
import { prisma } from "../../lib/prisma";
import { aplicarMovimentacao } from "../estoque/movimentacao.service";
import { buscarOrdemOuFalhar, includeCompleto, podeEditarItens, toDTO } from "./ordens.service";

export async function adicionarItem(
  ordemServicoId: string,
  input: { pecaId: string; quantidade: number },
  usuarioId: string
): Promise<OrdemServicoDTO> {
  const ordem = await buscarOrdemOuFalhar(ordemServicoId);
  if (!podeEditarItens(ordem.status)) {
    throw new ConflictError(`Não é possível adicionar peças a uma OS com status "${ordem.status}"`);
  }

  await prisma.$transaction(async (tx) => {
    const peca = await tx.peca.findUnique({ where: { id: input.pecaId } });
    if (!peca) throw new NotFoundError("Peça não encontrada");

    await aplicarMovimentacao(tx, {
      pecaId: input.pecaId,
      tipo: TipoMovimentacao.SAIDA,
      quantidade: input.quantidade,
      motivo: `Uso na OS #${ordem.numero}`,
      ordemServicoId,
      usuarioId,
    });

    await tx.ordemServicoItem.create({
      data: {
        ordemServicoId,
        pecaId: input.pecaId,
        quantidade: input.quantidade,
        precoUnitario: peca.precoVenda,
      },
    });
  });

  const atualizada = await prisma.ordemServico.findUnique({ where: { id: ordemServicoId }, include: includeCompleto });
  if (!atualizada) throw new NotFoundError("Ordem de serviço não encontrada");
  return toDTO(atualizada);
}

export async function removerItem(ordemServicoId: string, itemId: string, usuarioId: string): Promise<OrdemServicoDTO> {
  const ordem = await buscarOrdemOuFalhar(ordemServicoId);
  if (!podeEditarItens(ordem.status)) {
    throw new ConflictError(`Não é possível remover peças de uma OS com status "${ordem.status}"`);
  }

  const item = ordem.itens.find((i) => i.id === itemId);
  if (!item) throw new NotFoundError("Item não encontrado nesta OS");

  await prisma.$transaction(async (tx) => {
    await aplicarMovimentacao(tx, {
      pecaId: item.pecaId,
      tipo: TipoMovimentacao.ENTRADA,
      quantidade: item.quantidade,
      motivo: `Estorno de remoção de item na OS #${ordem.numero}`,
      ordemServicoId,
      usuarioId,
    });
    await tx.ordemServicoItem.delete({ where: { id: itemId } });
  });

  const atualizada = await prisma.ordemServico.findUnique({ where: { id: ordemServicoId }, include: includeCompleto });
  if (!atualizada) throw new NotFoundError("Ordem de serviço não encontrada");
  return toDTO(atualizada);
}
