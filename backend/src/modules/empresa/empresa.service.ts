import { EmpresaDTO } from "shared";
import { prisma } from "../../lib/prisma";

const EMPRESA_ID = "singleton";

type EmpresaInput = Partial<{
  nome: string;
  logoUrl: string;
  telefone: string;
  endereco: string;
  cnpj: string;
}>;

function toDTO(e: {
  nome: string;
  logoUrl: string | null;
  telefone: string | null;
  endereco: string | null;
  cnpj: string | null;
}): EmpresaDTO {
  return { nome: e.nome, logoUrl: e.logoUrl, telefone: e.telefone, endereco: e.endereco, cnpj: e.cnpj };
}

export async function obter(): Promise<EmpresaDTO> {
  const empresa = await prisma.empresa.upsert({
    where: { id: EMPRESA_ID },
    create: { id: EMPRESA_ID },
    update: {},
  });
  return toDTO(empresa);
}

export async function atualizar(input: EmpresaInput): Promise<EmpresaDTO> {
  const empresa = await prisma.empresa.upsert({
    where: { id: EMPRESA_ID },
    create: { id: EMPRESA_ID, ...input },
    update: input,
  });
  return toDTO(empresa);
}
