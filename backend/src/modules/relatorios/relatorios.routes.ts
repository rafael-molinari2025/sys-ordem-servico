import { Router } from "express";
import { PerfilUsuario } from "shared";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import { requireRole } from "../../middleware/requireRole.middleware";
import {
  relatorioClienteController,
  relatorioEstoqueController,
  relatorioFinanceiroController,
  relatorioOSController,
} from "./relatorios.controller";

export const relatoriosRoutes = Router();

relatoriosRoutes.get("/os", asyncHandler(relatorioOSController));
relatoriosRoutes.get("/estoque", asyncHandler(relatorioEstoqueController));
relatoriosRoutes.get("/cliente/:clienteId", asyncHandler(relatorioClienteController));

// Receita/faturamento é informação financeira sensível — restrito a Admin.
relatoriosRoutes.get("/financeiro", requireRole(PerfilUsuario.ADMIN), asyncHandler(relatorioFinanceiroController));
