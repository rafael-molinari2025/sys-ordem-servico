import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { loginController, meController } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", asyncHandler(loginController));
authRoutes.get("/me", authMiddleware, asyncHandler(meController));
