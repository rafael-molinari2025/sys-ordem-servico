-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "telefone" TEXT;

-- CreateTable
CREATE TABLE "RedefinicaoSenha" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedefinicaoSenha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RedefinicaoSenha_token_key" ON "RedefinicaoSenha"("token");

-- CreateIndex
CREATE INDEX "RedefinicaoSenha_token_idx" ON "RedefinicaoSenha"("token");

-- AddForeignKey
ALTER TABLE "RedefinicaoSenha" ADD CONSTRAINT "RedefinicaoSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
