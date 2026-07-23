import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PerfilUsuario } from "shared";
import { env } from "../config/env";
import { UnauthorizedError } from "../errors";

export interface AuthPayload {
  sub: string;
  perfil: PerfilUsuario;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token não informado");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado");
  }
}
