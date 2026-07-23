import crypto from "node:crypto";

/** Gera um token aleatório seguro, URL-safe, usado como credencial de acesso ao link público de autorização. */
export function generateToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}
