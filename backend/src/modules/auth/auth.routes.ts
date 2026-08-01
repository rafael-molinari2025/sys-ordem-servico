import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  esqueciSenhaController,
  loginController,
  meController,
  redefinirSenhaController,
  validarTokenRedefinicaoController,
} from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", asyncHandler(loginController));
authRoutes.get("/me", authMiddleware, asyncHandler(meController));
authRoutes.post("/esqueci-senha", asyncHandler(esqueciSenhaController));
authRoutes.get("/redefinir-senha/:token", asyncHandler(validarTokenRedefinicaoController));
authRoutes.post("/redefinir-senha/:token", asyncHandler(redefinirSenhaController));
