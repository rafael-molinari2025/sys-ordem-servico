import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { empresaRoutes } from "./modules/empresa/empresa.routes";
import { usuariosRoutes } from "./modules/usuarios/usuarios.routes";
import { clientesRoutes } from "./modules/clientes/clientes.routes";
import { pecasRoutes } from "./modules/estoque/pecas.routes";
import { servicosRoutes } from "./modules/servicos/servicos.routes";
import { ordensRoutes } from "./modules/ordens/ordens.routes";
import { orcamentosRoutes } from "./modules/orcamentos/orcamentos.routes";
import { autorizacaoPublicaRoutes } from "./modules/orcamentos/autorizacao.public.routes";
import { whatsappRoutes } from "./modules/whatsapp/whatsapp.routes";
import { relatoriosRoutes } from "./modules/relatorios/relatorios.routes";

export const app = express();

// Em produção, restringe o CORS às origens listadas em FRONTEND_URL (aceita várias,
// separadas por vírgula, para cobrir domínio próprio + preview URLs). Em dev, mantém
// aberto para não travar o fluxo local do time.
const allowedOrigins = env.FRONTEND_URL.split(",").map((origin) => origin.trim());

app.use(
  cors(
    env.NODE_ENV === "production"
      ? { origin: allowedOrigins }
      : undefined,
  ),
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Rotas de autenticação (login é público, /me exige token)
app.use("/api/auth", authRoutes);

// Rota pública de autorização de orçamento — propositalmente SEM authMiddleware,
// montada isolada de todo o resto para que nenhuma rota autenticada vaze por engano.
app.use("/api/publico/autorizacao", autorizacaoPublicaRoutes);

// A partir daqui, todas as rotas exigem usuário autenticado.
app.use("/api/usuarios", authMiddleware, usuariosRoutes);
app.use("/api/empresa", authMiddleware, empresaRoutes);
app.use("/api/clientes", authMiddleware, clientesRoutes);
app.use("/api/pecas", authMiddleware, pecasRoutes);
app.use("/api/servicos", authMiddleware, servicosRoutes);
app.use("/api/ordens", authMiddleware, ordensRoutes);
app.use("/api/ordens", authMiddleware, orcamentosRoutes);
app.use("/api/whatsapp", authMiddleware, whatsappRoutes);
app.use("/api/relatorios", authMiddleware, relatoriosRoutes);

app.use(errorHandler);
