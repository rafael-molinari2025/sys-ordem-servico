import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import {
  adicionarItemController,
  adicionarServicoController,
  atualizarController,
  buscarController,
  criarController,
  listarController,
  mudarStatusController,
  removerItemController,
  removerServicoController,
} from "./ordens.controller";

export const ordensRoutes = Router();

ordensRoutes.get("/", asyncHandler(listarController));
ordensRoutes.post("/", asyncHandler(criarController));
ordensRoutes.get("/:id", asyncHandler(buscarController));
ordensRoutes.patch("/:id", asyncHandler(atualizarController));
ordensRoutes.patch("/:id/status", asyncHandler(mudarStatusController));
ordensRoutes.post("/:id/itens", asyncHandler(adicionarItemController));
ordensRoutes.delete("/:id/itens/:itemId", asyncHandler(removerItemController));
ordensRoutes.post("/:id/servicos", asyncHandler(adicionarServicoController));
ordensRoutes.delete("/:id/servicos/:servicoId", asyncHandler(removerServicoController));
