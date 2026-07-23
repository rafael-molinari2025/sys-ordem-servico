# Deploy em produção

Topologia: **backend no Render (free tier)** e **frontend estático no Vercel (free tier)**,
apontando para o backend por HTTPS. Banco de dados: continua o mesmo Postgres na nuvem
(Neon/Supabase) já usado em dev.

> ⚠️ **Limitação aceita conscientemente**: o plano free do Render não oferece disco
> persistente (isso só existe nos planos pagos) e o serviço "dorme" após ~15 min sem
> tráfego. Na prática isso significa que a pasta da sessão do WhatsApp
> (`WHATSAPP_SESSION_PATH`) é apagada **toda vez que o container reinicia** — em cada
> deploy, cada crash e cada "acordar" após dormir. Ou seja: o QR code do WhatsApp
> provavelmente vai precisar ser escaneado de novo com frequência em produção. O resto
> do sistema (login, OS, estoque, PDF de orçamento para download) funciona normalmente
> e não depende disso — só a automação de *envio* do orçamento por WhatsApp é afetada.
> Se isso virar um problema no dia a dia, o caminho é migrar o backend para um plano com
> disco persistente (Render pago, Railway, Fly.io, ou uma VPS/Oracle Cloud Always Free).

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
5. Depois do deploy, abra os logs do serviço no Render e escaneie o QR code do WhatsApp
   (também aparece em `/configuracoes/whatsapp` no app, uma vez que o frontend estiver no
   ar). Lembre-se: vai precisar repetir isso sempre que o container reiniciar (ver aviso
   acima).
6. Anote a URL pública gerada pelo Render (algo como `https://sys-dezesseis-backend.onrender.com`)
   — é o valor de `VITE_API_URL` no passo do frontend.

### Sobre o "dormir" por inatividade

O free tier do Render derruba o processo após ~15 min sem requisições e a primeira
requisição seguinte demora mais (cold start, ~30-60s) enquanto ele sobe de novo. Isso é
aceitável para uso interno de baixo tráfego, mas se quiser evitar o cold start (sem
resolver a perda de sessão do WhatsApp, que é sobre disco, não sobre estar dormindo) dá
pra configurar um serviço externo de "ping" a cada 10 min no `/api/health` — não é algo
que eu configure por padrão porque é mais uma camada de infraestrutura para manter.

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
- [ ] QR code do WhatsApp escaneado no ambiente de produção (sessão não é a mesma da sua máquina de dev, e some a cada restart no free tier — ver aviso no topo)
- [ ] Criado ao menos um usuário Admin real no banco de produção (a seed é só para dev/demo)

## Notas

- `orcamentos.service.ts` sempre expõe o PDF para download independente do WhatsApp estar
  conectado — então mesmo com o WhatsApp caindo/desconectando em produção (ver aviso sobre
  disco não persistente), o core do sistema continua funcionando; só a automação de envio
  fica indisponível até reconectar e escanear o QR de novo.
- Existe também `railway.json` no repo, caso decidam migrar o backend para o Railway (ou
  outro serviço com disco persistente) no futuro — usa o mesmo `backend/Dockerfile`.
