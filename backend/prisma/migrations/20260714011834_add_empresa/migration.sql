-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Minha Empresa',
    "logoUrl" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "cnpj" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);
