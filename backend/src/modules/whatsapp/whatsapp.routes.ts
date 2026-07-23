import { Router } from "express";
import { PerfilUsuario } from "shared";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import { requireRole } from "../../middleware/requireRole.middleware";
import { statusController } from "./whatsapp.controller";

export const whatsappRoutes = Router();

whatsappRoutes.use(requireRole(PerfilUsuario.ADMIN));
whatsappRoutes.get("/status", asyncHandler(statusController));
