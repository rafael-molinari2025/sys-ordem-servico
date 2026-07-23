# Deploy em produção

Topologia: **backend no Railway** (processo long-running + disco persistente, necessário para
a sessão do WhatsApp) e **frontend estático no Vercel**, apontando para o backend por HTTPS.
Banco de dados: continua o mesmo Postgres na nuvem (Neon/Supabase) já usado em dev.

## 1. Backend (Railway)

1. Crie um projeto no Railway e conecte este repositório (branch `main`).
2. O Railway detecta `railway.json` na raiz automaticamente e builda via
   `backend/Dockerfile` (contexto = raiz do monorepo, por causa do workspace `shared`).
3. Adicione um **Volume** no serviço, montado em `/app/backend/whatsapp-session`
   (mesmo caminho absoluto que vai em `WHATSAPP_SESSION_PATH` abaixo) — sem isso, a sessão
   do WhatsApp se perde a cada deploy e o QR precisa ser escaneado de novo.
4. Configure as variáveis de ambiente do serviço:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | connection string do Postgres de produção (Neon/Supabase) |
   | `JWT_SECRET` | string aleatória longa e nova — **não reaproveite a de dev** |
   | `JWT_EXPIRES_IN` | `12h` (ou o que preferir) |
   | `FRONTEND_URL` | URL(s) do frontend em produção, separadas por vírgula se houver mais de uma (ex.: `https://seudominio.com,https://seuapp.vercel.app`) |
   | `WHATSAPP_SESSION_PATH` | `/app/backend/whatsapp-session` (mesmo path do Volume) |
   | `NODE_ENV` | `production` |
   | `PORT` | Railway injeta automaticamente; não precisa setar |

5. Deploy. O `CMD` do Dockerfile roda `prisma migrate deploy` antes de subir o servidor,
   então as migrações do banco de produção são aplicadas automaticamente a cada deploy.
6. Depois do primeiro deploy, abra os logs do serviço e escaneie o QR code do WhatsApp
   (aparece também em `/configuracoes/whatsapp` no app, uma vez que o frontend estiver no ar).
7. Anote a URL pública gerada pelo Railway (ou configure um domínio próprio) — é o valor de
   `VITE_API_URL` no passo do frontend.

## 2. Frontend (Vercel)

1. Importe o mesmo repositório no Vercel.
2. Root Directory: `frontend`.
3. Build Command: `npm run build` — Output Directory: `dist` (padrão do Vite, já detectado).
4. Variável de ambiente: `VITE_API_URL` = `https://<seu-backend-no-railway>/api`
   (a Vercel builda o frontend com essa variável embutida — sem ela, ele cai no
   fallback de `http://localhost:3333/api`, que não existe em produção).
5. `frontend/vercel.json` já cuida do rewrite de SPA (todas as rotas caem em `index.html`,
   necessário porque é uma app React Router client-side).
6. Deploy. Depois de no ar, volte no Railway e confirme que `FRONTEND_URL` inclui esse
   domínio final da Vercel (senão o CORS de produção bloqueia as chamadas).

## Checklist antes de considerar "no ar"

- [ ] `JWT_SECRET` de produção é diferente do valor de exemplo/dev
- [ ] `DATABASE_URL` aponta para o Postgres de produção (não o de dev)
- [ ] Volume persistente montado em `WHATSAPP_SESSION_PATH` no Railway
- [ ] `FRONTEND_URL` no backend lista exatamente os domínios do frontend em produção
- [ ] `VITE_API_URL` no frontend aponta pro domínio HTTPS do backend em produção
- [ ] QR code do WhatsApp escaneado no ambiente de produção (sessão é local ao volume, não é a mesma da sua máquina de dev)
- [ ] Criado ao menos um usuário Admin real no banco de produção (a seed é só para dev/demo)

## Notas

- O backend precisa ser um processo sempre ativo com disco persistente por causa do
  WhatsApp (`whatsapp-web.js` + Puppeteer + sessão salva em disco) — por isso não é
  compatível com hospedagem serverless (Vercel Functions, Netlify Functions etc.) para
  essa parte. Se um dia o envio via WhatsApp for descontinuado, essa restrição cai junto.
- `orcamentos.service.ts` sempre expõe o PDF para download independente do WhatsApp estar
  conectado — então mesmo que o WhatsApp caia em produção, o core do sistema continua
  funcionando; só a automação de envio fica indisponível até reconectar.
