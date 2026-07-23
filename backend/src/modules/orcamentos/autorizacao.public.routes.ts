import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import { decidirController, visualizarController } from "./autorizacao.public.controller";

/**
 * Router público — NUNCA receber authMiddleware aqui. Montado isoladamente em app.ts
 * exatamente para que nenhuma rota autenticada possa acabar exposta publicamente por engano.
 */
export const autorizacaoPublicaRoutes = Router();

autorizacaoPublicaRoutes.get("/:token", asyncHandler(visualizarController));
autorizacaoPublicaRoutes.post("/:token/decidir", asyncHandler(decidirController));
