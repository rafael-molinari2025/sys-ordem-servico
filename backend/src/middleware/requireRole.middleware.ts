import { NextFunction, Request, Response } from "express";
import { PerfilUsuario } from "shared";
import { ForbiddenError, UnauthorizedError } from "../errors";

export function requireRole(...perfis: PerfilUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError();
    if (!perfis.includes(req.user.perfil)) {
      throw new ForbiddenError("Este recurso é restrito a: " + perfis.join(", "));
    }
    next();
  };
}
