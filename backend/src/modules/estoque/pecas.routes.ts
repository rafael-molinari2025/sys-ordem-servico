import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import {
  atualizarController,
  baixoEstoqueController,
  buscarController,
  criarController,
  criarMovimentacaoController,
  listarController,
  listarMovimentacoesController,
  removerController,
} from "./pecas.controller";

export const pecasRoutes = Router();

pecasRoutes.get("/baixo-estoque", asyncHandler(baixoEstoqueController));
pecasRoutes.get("/", asyncHandler(listarController));
pecasRoutes.post("/", asyncHandler(criarController));
pecasRoutes.get("/:id", asyncHandler(buscarController));
pecasRoutes.patch("/:id", asyncHandler(atualizarController));
pecasRoutes.delete("/:id", asyncHandler(removerController));
pecasRoutes.get("/:id/movimentacoes", asyncHandler(listarMovimentacoesController));
pecasRoutes.post("/:id/movimentacoes", asyncHandler(criarMovimentacaoController));
