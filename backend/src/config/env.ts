import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  PORT: z.coerce.number().default(3333),
  JWT_SECRET: z.string().min(10, "JWT_SECRET deve ter ao menos 10 caracteres"),
  JWT_EXPIRES_IN: z.string().default("12h"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  WHATSAPP_SESSION_PATH: z.string().default("./whatsapp-session"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Configuração de ambiente inválida — verifique o arquivo backend/.env");
}

export const env = parsed.data;

/** FRONTEND_URL aceita múltiplos domínios separados por vírgula (para o allowlist de CORS) — para
 * montar um link voltado ao usuário (autorização de orçamento, redefinição de senha), sempre usa
 * apenas o primeiro, nunca a string bruta com vírgulas. */
export const frontendUrlPrincipal = env.FRONTEND_URL.split(",")[0].trim();
