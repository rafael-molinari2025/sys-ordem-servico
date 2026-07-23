import { Router } from "express";
import { PerfilUsuario } from "shared";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import { requireRole } from "../../middleware/requireRole.middleware";
import { atualizarController, obterController } from "./empresa.controller";

export const empresaRoutes = Router();

empresaRoutes.use(requireRole(PerfilUsuario.ADMIN));
empresaRoutes.get("/", asyncHandler(obterController));
empresaRoutes.put("/", asyncHandler(atualizarController));
