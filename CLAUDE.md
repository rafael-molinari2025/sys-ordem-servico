# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A web system for managing Ordens de Serviço (service orders) for small/medium businesses across multiple segments (auto repair, electronics repair, general services, etc.) — client management, parts inventory with stock deduction, service catalog, order pricing, PDF quote/report generation, WhatsApp-based quote delivery with a public client-authorization link, and role-based access (Admin / Atendente).

The full architecture rationale and phased build plan live in the approved plan doc — read it before making structural changes: `C:\Users\FAC CONSIG 02\.claude\plans\hidden-weaving-platypus.md`. Everything in this file reflects decisions already made there; don't relitigate stack/DB/WhatsApp/auth choices without checking that doc first.

**Build status**: Phases 1–4 complete and Phase 5 (polish/hardening) underway — auth, Clientes/Peças/Serviços/Usuários CRUD, the full OS core flow (`backend/src/modules/ordens/`, `frontend/src/pages/ordens/`), PDF+WhatsApp+public authorization (`backend/src/modules/orcamentos/`, `backend/src/modules/whatsapp/`, `backend/src/pdf/`, `frontend/src/pages/orcamento/OrcamentoAutorizacaoPage.tsx`, `frontend/src/pages/configuracoes/WhatsappStatusPage.tsx`), the four PDF reports (`backend/src/modules/relatorios/`, `frontend/src/pages/relatorios/RelatoriosPage.tsx`), a mobile-responsive nav drawer in `frontend/src/layout/AppLayout.tsx`, an in-app help page (`frontend/src/pages/AjudaPage.tsx`) that renders `manual/MANUAL_DE_UTILIZACAO.md` via `react-markdown`, and user management (`frontend/src/pages/usuarios/UsuariosPage.tsx`). Phase 5 hardening so far added: a DB-backed company-profile settings page (`backend/src/modules/empresa/`, `frontend/src/pages/configuracoes/EmpresaPage.tsx`), a dark "tech" visual theme across the whole frontend, a React `ErrorBoundary` + per-page fetch-failure fallback (`frontend/src/components/PageErrorFallback.tsx`), consistent PT-BR zod validation messages, process-level crash resilience against WhatsApp background failures (see below), and a WhatsApp-based "esqueci minha senha" flow (`backend/src/modules/auth/`, `frontend/src/pages/EsqueciSenhaPage.tsx`, `frontend/src/pages/RedefinirSenhaPage.tsx` — see below). The app is deployed and live: backend on Render (`sys-dezesseis-backend`, free tier), frontend on Vercel (`sys-ordem-servico`, custom domain `ordem-servicos.primetitec.com.br`) — see the Deployment section below.

## Commands

Run from the repo root (npm workspaces — `shared`, `backend`, `frontend`):

```
npm install                              # installs all three workspaces at once
npm run dev:backend                      # backend on http://localhost:3333 (tsx watch)
npm run dev:frontend                     # frontend on http://localhost:5173 (Vite)
npm run prisma:migrate                   # prisma migrate dev (backend workspace)
npm run prisma:seed                      # seeds demo users/clients/parts/services/orders
npm run test                             # vitest run (backend workspace)
npm run build                            # builds shared -> backend -> frontend, in that order
```

Scoped to a single workspace when needed: `npm run <script> --workspace backend` / `--workspace frontend`.

There is no local Postgres setup — the project intentionally uses a free cloud Postgres (Neon/Supabase) for both dev and prod, since the app must be reachable from anywhere. `DATABASE_URL` goes in `backend/.env` (copy the shape from root `.env.example`, which documents every env var for both apps). `backend/Dockerfile` exists only for the Render deploy (see Deployment below), not for local dev — day-to-day development still runs directly via `tsx`/`vite`, no containers involved.

Single test file: `npx vitest run path/to/file.test.ts` (from `backend/`).

## Architecture

### Monorepo shape

- `shared/` — TypeScript enums and DTO interfaces imported by **both** backend and frontend (`shared/src/enums.ts`, `shared/src/types.ts`). Resolved via a path alias (`shared` / `shared/*`) in both `backend/tsconfig.json` and `frontend/vite.config.ts` — not published as an npm package, just source-referenced. When changing a status enum, a DTO shape, or the OS status transition table, edit it once here; both apps pick it up.
- `backend/` — Express + TypeScript + Prisma, plain modular routes/controller/service split (no NestJS by design — see plan doc rationale).
- `frontend/` — React + Vite + TypeScript + Tailwind, React Query for all server state, a thin `AuthContext` for the logged-in user (no Redux — see plan doc rationale).

### Backend module pattern

Every resource under `backend/src/modules/<name>/` follows `*.routes.ts` → `*.controller.ts` (zod validation, thin) → `*.service.ts` (Prisma calls + business rules + DTO shaping). Routes are mounted in `backend/src/app.ts`, which also wires global `authMiddleware` ahead of every resource router except `/api/auth`. `errorHandler` middleware is last; controllers/services throw typed errors from `backend/src/errors.ts` (`NotFoundError`, `ConflictError`, `EstoqueInsuficienteError`, `TransicaoInvalidaError`, `WhatsAppNaoConectadoError`, etc.) and never construct raw Express error responses — `asyncHandler` in `errorHandler.middleware.ts` forwards rejected promises there automatically.

The public authorization endpoints (`/api/publico/autorizacao/:token`, in `backend/src/modules/orcamentos/autorizacao.public.routes.ts`) are mounted in `app.ts` **without** `authMiddleware`, on their own router — this is a deliberate structural isolation so no authenticated-only route can accidentally end up public. Don't add auth-free routes anywhere else.

### Role-based field hiding happens in the service layer, not the frontend

`Peca.precoCusto` (cost price) must never reach an Atendente's network response. This is enforced in `backend/src/modules/estoque/pecas.service.ts` via `toPecaDTO(peca, perfil)` — the **only** function allowed to turn a Prisma `Peca` into a `PecaDTO`. Every other DTO-shaping function in the codebase follows the same rule: one `toXDTO` function per resource, called from every service method, so field visibility rules live in exactly one place. The frontend also conditionally hides the cost column (`frontend/src/pages/estoque/PecasListPage.tsx`), but that's UX polish, not the security boundary — assume any frontend hiding can be bypassed and rely on the backend shaping instead.

### Money and stock are never simple field writes

- All currency fields are Prisma `Decimal` (Postgres `numeric`), never `Float`. `backend/src/utils/money.ts` has the only sanctioned conversion (`toMoneyNumber`) — apply it at the JSON-response boundary, never mid-calculation.
- Stock changes always go through `backend/src/modules/estoque/movimentacao.service.ts`. `aplicarMovimentacao(tx, input)` takes an open Prisma transaction client and does three things atomically: validates/adjusts `Peca.quantidade`, throws `EstoqueInsuficienteError` if it would go negative, and writes an append-only `MovimentacaoEstoque` audit row with the resulting balance (`saldoApos`). `registrarMovimentacaoManual` wraps it in its own transaction for manual entrada/saída/ajuste from the Estoque UI. `backend/src/modules/ordens/ordens.itens.service.ts` (adding/removing a part on an OS) calls `aplicarMovimentacao` inside the *same* `prisma.$transaction` as the `OrdemServicoItem` write/delete, never as a separate call — that's the whole reason the function takes a shared `tx` client instead of owning its own transaction, and it's what guarantees a part is never deducted without a corresponding order line or vice versa.
- `TipoMovimentacao.AJUSTE` takes quantidade as a signed delta directly (can correct up or down); `ENTRADA`/`SAIDA` take an always-positive quantidade and the sign is implied by tipo.

### "Remover" is soft-delete everywhere — `listar()` must filter `ativo: true`

`remover()` in `clientes.service.ts`, `pecas.service.ts`, and `servicos.service.ts` never
deletes a row — it sets `ativo: false`, because these entities can be referenced by
historical `OrdemServico`/`MovimentacaoEstoque` rows that must keep working. This is
correct and deliberate, but it only works end-to-end if `listar()` for that same resource
filters `where: { ativo: true, ...buscaCondition }`. This broke in practice: for months
`listar()` in all three services had no `ativo` filter, so clicking "Remover" silently
succeeded in the database while the row kept showing in the list forever — indistinguishable
from a completely broken button. If you add a new soft-deletable resource (or a new list
endpoint for an existing one), the `ativo: true` filter in `listar()` is not optional.
`usuarios.service.ts` is the deliberate exception — its `listar()` intentionally returns
inactive users too, because `UsuariosPage.tsx` shows an Ativo/Inativo badge and lets an
Admin reactivate someone, so hiding them there would be the actual bug.

### OS status is a whitelist state machine, not just an enum

`shared/src/enums.ts` defines `TRANSICOES_STATUS_OS`, the single source of truth for which `StatusOS` transitions are legal (`ORCAMENTO → AGUARDANDO_APROVACAO → APROVADO/RECUSADO → EM_ANDAMENTO → CONCLUIDO → ENTREGUE`, with `CANCELADO` reachable from any non-terminal state). Both backend enforcement (reject with 409 + write `StatusHistorico`) and any frontend status-dropdown filtering must read from this table, not hardcode the flow separately.

### Prisma schema relationships worth knowing before touching `ordens`

`OrdemServicoItem.precoUnitario` and `OrdemServicoServico.valor` are **snapshots** taken at the moment a part/service is added to an order — catalog prices (`Peca.precoVenda`, `Servico.precoPadrao`) drift over time, and historical orders must keep showing what was actually charged. Never join back to the catalog price for an existing order line; the snapshot is authoritative.

`OrdemServico.numero` is a separate human-friendly autoincrementing int (`OS #123`), distinct from the cuid `id` primary key — used in user-facing text (WhatsApp messages, PDF titles, stock-movement `motivo` strings).

### PDF and WhatsApp share one Chromium install

Root `package.json` has `"overrides": { "puppeteer": "^22.15.0" }` so whatsapp-web.js's own nested `puppeteer` dependency resolves to the same version as the top-level one instead of installing/downloading a second Chromium. `backend/src/modules/whatsapp/whatsapp.client.ts` also explicitly points its `puppeteer.executablePath` at `chromiumExecutablePath()` from `backend/src/pdf/pdf.engine.ts`. If you ever bump the `puppeteer` version, keep both in sync or you'll get two Chromium downloads again. WhatsApp automation is unofficial (whatsapp-web.js, not the Meta Business API) and carries real ban risk; `orcamentos.service.ts` always exposes a PDF-download path independent of WhatsApp connection state — never make WhatsApp send the only way to deliver a quote. `whatsapp.service.ts` throws a typed `WhatsAppNaoConectadoError` (surfaced as a friendly message in the OS detail page) when the session isn't `CONNECTED`, rather than failing silently.

**Never hardcode `PUPPETEER_EXECUTABLE_PATH` in the Docker build.** `chromiumExecutablePath()` (called from `whatsapp.client.ts` at module import time, i.e. before `server.ts` ever reaches `app.listen()`) calls `puppeteer.executablePath()`, which throws synchronously if the configured path doesn't actually exist on disk — crashing the whole process with no HTTP server ever bound and no log line, which on Render just looks like "no open ports detected" until the deploy times out. `backend/Dockerfile` deliberately does **not** set `PUPPETEER_EXECUTABLE_PATH`/`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` even though it's built `FROM ghcr.io/puppeteer/puppeteer` — that image manages its own Chrome install path internally (not at the commonly-assumed `/usr/bin/google-chrome-stable`), so `npm ci` is left to download Chrome itself via puppeteer's normal postinstall, guaranteeing `executablePath()` resolves to something that actually exists.

### The root `optionalDependencies` entry for Rollup is load-bearing, not leftover cruft

Root `package.json` declares `"optionalDependencies": { "@rollup/rollup-linux-x64-gnu": "..." }`, pinned to the exact version `vite`/`rollup` resolve to. This works around a real npm bug (npm/cli#4828) where, in an npm-workspaces monorepo, the Linux-native Rollup binary — a *transitive* optional dependency of `vite` — silently fails to install even on a from-scratch `npm install` with no lockfile, because it's "buried" too deep in the dependency graph for npm's optional-dependency resolver to reliably pick up. Declaring it as a **direct** optional dependency of the workspace root sidesteps the bug. This only matters for Linux CI/deploy environments (Vercel); `npm` silently skips it on Windows dev machines since its `package.json` declares `"os": ["linux"]`, so it's safe to leave in place regardless of what platform is developing locally. If `vite`/`rollup` is ever upgraded, bump this version to match or the frontend build will fail on Vercel again with `Cannot find module @rollup/rollup-linux-x64-gnu`.

### Company profile is a DB-backed singleton, not env vars

`backend/prisma/schema.prisma`'s `Empresa` model has no natural key to look up by, so `backend/src/modules/empresa/empresa.service.ts` always reads/writes a single fixed row (`id: "singleton"`) via `prisma.empresa.upsert(...)` — there is deliberately no `criar`/`listar`; only `obter()` and `atualizar()`. This replaced the old `EMPRESA_NOME`/`EMPRESA_LOGO_URL` env vars, which no longer exist in `env.ts` — company name, logo URL, phone, address, and CNPJ are edited by an Admin at `frontend/src/pages/configuracoes/EmpresaPage.tsx` (`/configuracoes/empresa`, one of two tabs alongside `/configuracoes/whatsapp` sharing `ConfiguracoesTabs.tsx`). `backend/src/pdf/templates/layout.ts`'s `wrapInLayout()` takes an `EmpresaDTO` as an explicit parameter (not a global/import-time read) and every one of the 5 template functions (`orcamento`, `relatorio-os`, `relatorio-financeiro`, `relatorio-estoque`, `historico-cliente`) threads it through from their callers (`orcamentos.service.ts`, `relatorios.controller.ts`), which each call `empresaService.obter()` before rendering. If you add a new PDF document, follow the same pattern rather than reaching for env vars or a cached global.

### WhatsApp send must resolve numbers through `getNumberId`, never hand-build a chat id

`backend/src/modules/whatsapp/whatsapp.service.ts` used to build chat ids as `` `${digits}@c.us` `` directly; this broke for real-world sends with `Error: No LID for user` once WhatsApp rolled out its LID (Linked ID) identity system — a phone-number-based JID that hasn't been resolved through the client first isn't a valid `sendMessage` target anymore. `resolveChatId()` now calls `whatsappClient.getNumberId(digits)` and throws a `ValidationError` with a clear PT-BR message if it resolves to `null` (number not on WhatsApp) instead of letting the raw library exception surface. Don't revert to manual `@c.us` string construction.

### Password reset rides on WhatsApp, not email — there is no email-sending infra in this app

The system has no SMTP/email-provider integration at all. "Esqueci minha senha"
(`POST /api/auth/esqueci-senha` → `RedefinicaoSenha` model → `GET`/`POST /api/auth/redefinir-senha/:token`)
follows the exact same public-token pattern as `OrcamentoAutorizacao` (single-use,
time-boxed token row, `whatsapp.service.ts`'s `sendTexto()`), just with a 30-minute
expiry instead of 15 days. `Usuario.telefone` is optional specifically to support this —
`solicitarRedefinicao()` in `auth.service.ts` never reveals to the caller whether the
email exists, is active, or has a phone on file (always the same generic response),
logging failures server-side instead, so the public endpoint can't be used to enumerate
accounts. Because this shares the WhatsApp session, it has the same free-tier availability
caveat as quote delivery (see Deployment) — if the session isn't connected, the reset
silently never arrives and the only server-side trace is a `logger.error` line.

### A background WhatsApp failure must never take down the whole API

`backend/src/server.ts` registers `process.on("unhandledRejection", ...)` and `process.on("uncaughtException", ...)` that log and deliberately do **not** exit the process. This exists because `whatsapp-web.js` fires puppeteer-internal async operations outside the normal request/response cycle (session keep-alive, auth checks) that can reject without any local `.catch()` — Node's default behavior is to crash the entire process on an unhandled rejection, which previously took the whole REST API down over an isolated WhatsApp hiccup. Route-level errors are unaffected by this — they're already caught by `asyncHandler` and never reach these global handlers; these are purely a safety net for rejections outside the Express lifecycle.

### Frontend dark theme: fixed color tokens, not ad-hoc Tailwind colors

`frontend/tailwind.config.js` defines four custom colors — `app` (#0B1220, page background), `surface` (#111827, sidebar), `card` (#161f2e, panels/tables/forms), `line` (#1F2937, borders) — plus standard Tailwind `indigo-600`/`cyan-400` for primary actions/links and `gray-100`…`gray-600` for the text ladder (lighter = more prominent, inverted from a light theme's slate scale). Every page follows the same conventions: `bg-card border-line` for panels, `bg-indigo-600 hover:bg-indigo-500` for primary buttons, `text-cyan-400 hover:text-cyan-300` for inline actions like "Editar", `text-red-400`/`bg-red-500/10` for destructive actions and error banners, `bg-X-500/15 text-X-300` for status badges (see `StatusBadge.tsx`). New pages should reuse these tokens rather than reintroducing the old light-theme `slate-*`/`bg-white` classes.

### A stuck "Carregando..." can hide a real fetch failure — always branch on `isError`

Single-resource detail pages (e.g. `OrdemDetailPage.tsx`) fetch by id with React Query. Early versions only checked `isLoading || !data`, which is true forever once a fetch fails and retries are exhausted (`isLoading` goes `false`, but `data` stays `undefined`) — the page silently hangs with no error and no way to retry, easily mistaken for a missing feature. Any page depending on a single required fetch must also check `isError` and render `frontend/src/components/PageErrorFallback.tsx` (message + "Tentar novamente" calling `refetch()`) instead of falling through to an infinite loading state. The global `QueryClient` in `main.tsx` retries queries twice (`retry: 2`) before giving up, given how often transient DB connectivity issues resolve on the very next attempt (see below).

### The Windows dev environment has sharp edges worth knowing about

This project has been developed on Windows with the repo on a small removable/external drive, behind Kaspersky. Real issues have surfaced repeatedly and their fixes matter if you hit similar symptoms again:
- **`npm install` failing with `spawnSync ... UNKNOWN` on `esbuild.exe`, or a `whatsapp-web.js`/puppeteer install failing with `end of central directory record signature not found`**: this was disk/cache corruption from interrupted installs, not a real config problem — fixed by `npm cache clean --force`, deleting `node_modules`, deleting `~/.cache/puppeteer` if the Chromium zip is implicated, and reinstalling. A Windows Defender exclusion on the repo folder (`Add-MpPreference -ExclusionPath`) also meaningfully speeds up installs on this drive.
- **`npm run dev:frontend` prints "ready" but the port never responds (times out, not connection-refused)**: this was a corrupted Vite dependency cache from previously killed dev-server processes — `node_modules/.vite` was left with orphaned `deps_temp_*` folders that never got promoted to `deps/`. Fix: stop all node/vite processes, `rm -rf frontend/node_modules/.vite`, restart. Don't chase phantom IPv4/IPv6/firewall theories first — check for `deps_temp_*` leftovers before anything else.
- **`shared` alias suddenly fails to resolve everywhere (Vitest, tsc) after the repo hasn't been touched in a while**: the repo lives on a removable/external drive whose letter isn't stable across reconnects. `node_modules/shared|backend|frontend` are `npm install`-created symlinks holding an absolute path baked in at install time; if the drive letter changed, they're now dangling. Fix: `npm install --workspaces --if-present` from the repo root re-links them against the current path — no full reinstall needed.
- **Prisma reports `P1001: Can't reach database server` (or the client's own pool times out) even though the DB is fine, and it's intermittent, not constant**: this box runs Kaspersky, which can silently intercept the Postgres wire protocol on port 5432 — a raw TCP connect still succeeds instantly (the 3-way handshake completes), but the SSL negotiation payload just hangs instead of erroring, so Prisma's client eventually times out. Check Kaspersky → Network Settings → "Portas monitoradas" → "Selecionar" for a monitored-port entry targeting Node.js on port 5432 and disable it. Kaspersky can also throttle large downloads (e.g. `npx puppeteer browsers install chrome` crawling at a few KB/s) — same root cause, fixed by trusting `node.exe` in Kaspersky's "Regras de rede de aplicativos" (Firewall app rules; the real `C:\Program Files\nodejs\node.exe`, not a bundled Node from some other tool). This DB flakiness can still happen even with Kaspersky fully configured — it self-resolves on retry often enough that `main.tsx`'s `QueryClient` retries twice before giving up (see above).
- **`npm run dev:backend` hangs forever with no "Backend rodando..." log line, or crashes immediately with a Puppeteer/Chrome-not-found stack trace**: `backend/src/modules/whatsapp/whatsapp.client.ts` resolves the Chromium executable path inside the top-level `new Client(...)` call, which runs at **module import time** — before `server.ts` even reaches `app.listen()`. Puppeteer's Chromium download lives per-Windows-user at `~/.cache/puppeteer` (unrelated to the repo's drive letter), so switching Windows profiles (or a fresh machine) means it's missing and the whole server fails to boot on an import-time exception. Fix: `cd backend && npx puppeteer browsers install chrome`.
- **`npm run dev:backend` fails to restart after an edit, with `EADDRINUSE: address already in use :::3333` and/or `Error: The browser is already running for .../whatsapp-session/session`**: `tsx watch` restarting the child process on Windows doesn't always cleanly kill the previous child's Puppeteer/Chromium grandchildren, so they (and the port) can survive the restart and collide with the new one. Symptom check: `Get-Process -Name chrome | Where-Object { $_.Path -like "*\.cache\puppeteer\*" }` in PowerShell — if that lists more than a handful, they're orphaned (don't touch other `chrome.exe` processes at that same path filter's absence; those are the developer's real browser, not Puppeteer's). Fix: stop those processes, delete the stale `backend/whatsapp-session/session/lockfile`, then start a single fresh `npm run dev:backend`. Avoid stacking multiple edits that each trigger their own tsx restart while a WhatsApp session is actively (re)connecting — let one restart fully settle (including "WhatsApp conectado." in the log) before editing again.

### The in-app manual reads a file from outside the frontend project root

`frontend/src/pages/AjudaPage.tsx` imports `../../../manual/MANUAL_DE_UTILIZACAO.md?raw` (Vite's raw-import suffix, typed via `vite/client`'s ambient `*?raw` module declaration) to render the same manual both as a repo doc and an in-app help page — deliberately one source of truth, not two. This only works because Vite auto-detects the npm-workspaces root and allows serving files under it; if `server.fs.allow` in `frontend/vite.config.ts` is ever narrowed, add the monorepo root back explicitly or this import will fail to resolve in dev.

## Deployment

The repo is a git repository pushed to a private GitHub remote (`rafael-molinari2025/sys-ordem-servico`) — both Render and Vercel deploy from pushes to `main`. Full step-by-step and the environment-variable checklist live in `DEPLOY.md` — read it before changing anything deploy-related. Summary of the topology and why:

- **Backend → Render** (`backend/Dockerfile`, driven by `render.yaml` at repo root). Must be a long-running process with persistent disk, which is why it can't be serverless — `WHATSAPP_SESSION_PATH` needs to survive between requests. The current setup is on Render's **free tier**, which has neither: the service sleeps on inactivity and has no persistent disk, so the WhatsApp session is lost on every container restart (redeploy, crash, or wake-from-sleep) and the QR has to be rescanned. Everything else (auth, OS, estoque, PDF download) is unaffected by this — only the WhatsApp *send* automation (quote delivery, password reset) depends on a live session. `railway.json` also exists at the repo root as a ready-to-go migration path to a host with persistent disk (Railway), reusing the same Dockerfile, if the WhatsApp session churn becomes a real problem.
  - `.github/workflows/keep-alive.yml` pings `/api/health` every 10 minutes via GitHub Actions to reduce (not eliminate) how often users hit the ~30-60s cold-start wake-up. It does **not** touch the WhatsApp-session problem above — that's about disk, not about being asleep. GitHub auto-disables scheduled workflows after 60 days of zero repo activity; if cold starts start happening on every request again after a quiet period, check Actions → keep-alive is still enabled before assuming something else broke.
- **Frontend → Vercel** (`frontend/vercel.json` handles the SPA rewrite). The Vercel project's **Root Directory is set to `frontend`** in its dashboard settings (not in a repo file) — this is what makes Vercel install from the monorepo root (so the `shared` workspace resolves) while still building/serving from `frontend/`. If a future Vercel project ever gets linked from scratch, that Root Directory setting has to be set explicitly again, or the build fails with `shared/lib/shared.d.ts is not a module` because `shared`'s package.json/tsconfig never gets uploaded. The project is linked to the GitHub repo (`Project Settings → Git`), so a plain `git push` to `main` auto-deploys the frontend the same way Render auto-deploys the backend — `vercel deploy --prod` by hand is no longer the normal path, only a fallback if the Git integration ever gets disconnected. Production is also reachable at the custom domain `ordem-servicos.primetitec.com.br` (CNAME → `cname.vercel-dns.com.`), aliased alongside the `*.vercel.app` URL.
- **CORS is origin-restricted only when `NODE_ENV=production`** (`backend/src/app.ts`) — `FRONTEND_URL` (comma-separated for multiple allowed origins) drives the allowlist; in any other `NODE_ENV` it stays wide open for local dev convenience. Forgetting to add a new frontend domain to `FRONTEND_URL` on Render (and restarting/redeploying — see below) is the most common way a working deploy suddenly starts failing all API calls from the browser with no obvious server-side error.
- **Env var changes on Render require a new deploy, not just a restart.** Render's `/restart` API only cycles the existing container process; it does **not** re-inject updated environment variable values into it — only a fresh deploy does that. If you change an env var (e.g. `FRONTEND_URL`) and only restart, the app keeps running with the *old* value with no error or warning anywhere, which looks exactly like a CORS misconfiguration until you check.
- The production DB is, at least currently, the **same Neon Postgres instance used for local dev** (a deliberate short-term tradeoff to ship faster, not a recommendation to keep doing this) — there's no separate prod database yet, so seed-run demo rows and any local dev testing both land in what production also reads.

## Environment

Copy `.env.example` → `backend/.env` and `frontend/.env`. Key backend vars: `DATABASE_URL` (Neon/Supabase Postgres connection string), `JWT_SECRET`/`JWT_EXPIRES_IN`, `FRONTEND_URL` (used both to build the WhatsApp authorization link, e.g. `${FRONTEND_URL}/autorizacao/:token`, and — when `NODE_ENV=production` — as the CORS allowlist, comma-separated for multiple origins; see Deployment above), `WHATSAPP_SESSION_PATH` (gitignored — holds the persisted WhatsApp Web session so the QR only needs scanning once), `NODE_ENV` (defaults to `development`; only `production` triggers the CORS restriction, doesn't otherwise change backend behavior). `backend/src/config/env.ts` validates all of this at startup with zod and throws immediately on a missing/invalid var rather than failing later at first use.
