import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import {
  atualizarController,
  buscarController,
  criarController,
  historicoController,
  listarController,
  removerController,
} from "./clientes.controller";

export const clientesRoutes = Router();

clientesRoutes.get("/", asyncHandler(listarController));
clientesRoutes.post("/", asyncHandler(criarController));
clientesRoutes.get("/:id", asyncHandler(buscarController));
clientesRoutes.patch("/:id", asyncHandler(atualizarController));
clientesRoutes.delete("/:id", asyncHandler(removerController));
clientesRoutes.get("/:id/historico", asyncHandler(historicoController));
