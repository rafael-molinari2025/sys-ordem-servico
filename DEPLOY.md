# Deploy em produção

Topologia: **backend no Render (free tier)** e **frontend estático no Vercel (free tier)**,
apontando para o backend por HTTPS. Banco de dados: continua o mesmo Postgres na nuvem
(Neon/Supabase) já usado em dev.

> ℹ️ O plano free do Render não oferece disco persistente e o serviço "dorme" após ~15 min
> sem tráfego (cold start na próxima requisição, ver seção abaixo). Isso não afeta nada
> hoje: a automação de envio de orçamento por WhatsApp foi desativada (ver `CLAUDE.md`)
> justamente por ter se mostrado pouco confiável nesse ambiente — falhas de pareamento e
> a própria sessão sendo encerrada pelo WhatsApp após poucas tentativas de conexão a
> partir de um IP de datacenter, competindo por memória com o Chromium usado na geração
> de PDF. O sistema hoje entrega o orçamento sempre via **PDF para baixar e enviar
> manualmente** (o PDF já inclui o link de aprovação do cliente).

## 1. Backend (Render)

1. Crie uma conta no Render e conecte este repositório.
2. Use **New + → Blueprint** e aponte para este repo — o Render lê o `render.yaml` da raiz
   automaticamente e já configura o serviço Docker (`backend/Dockerfile`, plano free).
   Se preferir configurar manualmente em vez de usar o Blueprint: New + → Web Service →
   Runtime "Docker" → Dockerfile Path `backend/Dockerfile` → Docker Context `.` (raiz do
   monorepo, necessário por causa do workspace `shared`) → Plan "Free".
3. Preencha as variáveis de ambiente marcadas como `sync: false` no `render.yaml`
   (o Render vai pedir o valor na hora de criar o Blueprint):

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | connection string do Postgres de produção (Neon/Supabase) |
   | `JWT_SECRET` | string aleatória longa e nova — **não reaproveite a de dev** |
   | `FRONTEND_URL` | URL(s) do frontend em produção, separadas por vírgula se houver mais de uma (ex.: `https://seudominio.com,https://seuapp.vercel.app`) |

   As demais (`NODE_ENV`, `JWT_EXPIRES_IN`, `WHATSAPP_SESSION_PATH`) já vêm com valor
   padrão no `render.yaml`. `PORT` é injetado automaticamente pelo Render.
4. Deploy. O `CMD` do Dockerfile roda `prisma migrate deploy` antes de subir o servidor,
   então as migrações do banco de produção são aplicadas automaticamente a cada deploy.
5. Anote a URL pública gerada pelo Render (algo como `https://sys-dezesseis-backend.onrender.com`)
   — é o valor de `VITE_API_URL` no passo do frontend.

### Sobre o "dormir" por inatividade

O free tier do Render derruba o processo após ~15 min sem requisições e a primeira
requisição seguinte demora mais (cold start, ~30-60s, podendo passar de 1 min) enquanto
ele sobe de novo — na prática, a primeira ação de quem acessa o sistema depois de um
tempo parado (ex.: salvar um cadastro) fica presa esperando o container acordar.

Isso é mitigado por um **monitor externo do UptimeRobot** (conta separada, fora deste
repositório) que faz um ping em `/api/health` a cada 5 minutos, mantendo o backend
sempre desperto na prática. Esse é o segundo mecanismo tentado para isso — o primeiro
foi um workflow do GitHub Actions (`.github/workflows/keep-alive.yml`, já removido)
configurado para rodar a cada 10 minutos, mas que na prática só disparava a cada
1h30–2h30 (medido via `gh api .../actions/runs`), porque o agendador do GitHub Actions
não é confiável para intervalos curtos (menos de 1h), independente da configuração no
YAML. Se o sistema voltar a ficar lento do nada, o primeiro lugar a checar é se o
monitor do UptimeRobot continua ativo (login em uptimerobot.com) — não vai aparecer
nada sobre isso no histórico do Git ou do GitHub Actions, já que é externo ao
repositório.

## 2. Frontend (Vercel)

1. Importe o mesmo repositório no Vercel.
2. Root Directory: `frontend`.
3. Build Command: `npm run build` — Output Directory: `dist` (padrão do Vite, já detectado).
4. Variável de ambiente: `VITE_API_URL` = `https://<seu-backend-no-render>/api`
   (a Vercel builda o frontend com essa variável embutida — sem ela, ele cai no
   fallback de `http://localhost:3333/api`, que não existe em produção).
5. `frontend/vercel.json` já cuida do rewrite de SPA (todas as rotas caem em `index.html`,
   necessário porque é uma app React Router client-side).
6. Deploy. Depois de no ar, volte no Render e confirme que `FRONTEND_URL` inclui esse
   domínio final da Vercel (senão o CORS de produção bloqueia as chamadas).

## Checklist antes de considerar "no ar"

- [ ] `JWT_SECRET` de produção é diferente do valor de exemplo/dev
- [ ] `DATABASE_URL` aponta para o Postgres de produção (não o de dev)
- [ ] `FRONTEND_URL` no backend lista exatamente os domínios do frontend em produção
- [ ] `VITE_API_URL` no frontend aponta pro domínio HTTPS do backend em produção
- [ ] Criado ao menos um usuário Admin real no banco de produção (a seed é só para dev/demo)

## Notas

- A entrega de orçamento é só via **PDF para baixar e enviar manualmente** — o botão
  "Baixar PDF do orçamento" sempre funciona e já inclui o link de aprovação do cliente.
  O envio automático por WhatsApp foi desativado (ver `CLAUDE.md`, seção "WhatsApp
  automation was disabled").
- Existe também `railway.json` no repo, caso decidam migrar o backend para o Railway (ou
  outro serviço com disco persistente) no futuro — usa o mesmo `backend/Dockerfile`.
