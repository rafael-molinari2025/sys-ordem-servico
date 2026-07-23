import { Router } from "express";
import { PerfilUsuario } from "shared";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import { requireRole } from "../../middleware/requireRole.middleware";
import { atualizarController, criarController, listarController, removerController } from "./usuarios.controller";

export const usuariosRoutes = Router();

usuariosRoutes.use(requireRole(PerfilUsuario.ADMIN));
usuariosRoutes.get("/", asyncHandler(listarController));
usuariosRoutes.post("/", asyncHandler(criarController));
usuariosRoutes.patch("/:id", asyncHandler(atualizarController));
usuariosRoutes.delete("/:id", asyncHandler(removerController));
