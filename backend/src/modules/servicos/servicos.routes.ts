import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import { atualizarController, buscarController, criarController, listarController, removerController } from "./servicos.controller";

export const servicosRoutes = Router();

servicosRoutes.get("/", asyncHandler(listarController));
servicosRoutes.post("/", asyncHandler(criarController));
servicosRoutes.get("/:id", asyncHandler(buscarController));
servicosRoutes.patch("/:id", asyncHandler(atualizarController));
servicosRoutes.delete("/:id", asyncHandler(removerController));
