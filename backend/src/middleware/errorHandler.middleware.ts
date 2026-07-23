import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors";
import { logger } from "../lib/logger";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  logger.error(err);
  return res.status(500).json({ error: "Erro interno do servidor" });
}

/** Envolve um handler async para encaminhar exceções ao errorHandler, sem precisar de try/catch em toda rota. */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
