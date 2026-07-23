import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import { enviarWhatsAppController, gerarPdfController } from "./orcamentos.controller";

export const orcamentosRoutes = Router();

orcamentosRoutes.get("/:id/orcamento/pdf", asyncHandler(gerarPdfController));
orcamentosRoutes.post("/:id/orcamento/enviar", asyncHandler(enviarWhatsAppController));
