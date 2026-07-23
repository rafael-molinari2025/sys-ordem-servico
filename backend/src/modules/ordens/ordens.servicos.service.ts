import { OrdemServicoDTO } from "shared";
import { ConflictError, NotFoundError } from "../../errors";
import { prisma } from "../../lib/prisma";
import { buscarOrdemOuFalhar, includeCompleto, podeEditarItens, toDTO } from "./ordens.service";

export async function adicionarServico(
  ordemServicoId: string,
  input: { servicoId: string; valor?: number; observacao?: string }
): Promise<OrdemServicoDTO> {
  const ordem = await buscarOrdemOuFalhar(ordemServicoId);
  if (!podeEditarItens(ordem.status)) {
    throw new ConflictError(`Não é possível adicionar serviços a uma OS com status "${ordem.status}"`);
  }

  const servico = await prisma.servico.findUnique({ where: { id: input.servicoId } });
  if (!servico) throw new NotFoundError("Serviço não encontrado");

  await prisma.ordemServicoServico.create({
    data: {
      ordemServicoId,
      servicoId: input.servicoId,
      valor: input.valor ?? servico.precoPadrao,
      observacao: input.observacao,
    },
  });

  const atualizada = await prisma.ordemServico.findUnique({ where: { id: ordemServicoId }, include: includeCompleto });
  if (!atualizada) throw new NotFoundError("Ordem de serviço não encontrada");
  return toDTO(atualizada);
}

export async function removerServico(ordemServicoId: string, itemId: string): Promise<OrdemServicoDTO> {
  const ordem = await buscarOrdemOuFalhar(ordemServicoId);
  if (!podeEditarItens(ordem.status)) {
    throw new ConflictError(`Não é possível remover serviços de uma OS com status "${ordem.status}"`);
  }

  const item = ordem.servicosRealizados.find((s) => s.id === itemId);
  if (!item) throw new NotFoundError("Serviço não encontrado nesta OS");

  await prisma.ordemServicoServico.delete({ where: { id: itemId } });

  const atualizada = await prisma.ordemServico.findUnique({ where: { id: ordemServicoId }, include: includeCompleto });
  if (!atualizada) throw new NotFoundError("Ordem de serviço não encontrada");
  return toDTO(atualizada);
}
