# Sistema de Ordem de Serviço

Sistema web para gestão de ordens de serviço, estoque de peças, catálogo de serviços, clientes, orçamentos em PDF com autorização via link, envio por WhatsApp e relatórios — pensado para funcionar em qualquer segmento (oficina, assistência técnica, serviços gerais etc).

Para o manual de uso do sistema (como operar no dia a dia), veja [`manual/MANUAL_DE_UTILIZACAO.md`](manual/MANUAL_DE_UTILIZACAO.md).

## Estrutura

- `backend/` — API Node.js + Express + TypeScript + Prisma (PostgreSQL)
- `frontend/` — Interface web React + Vite + TypeScript + Tailwind
- `shared/` — Tipos e enums compartilhados entre backend e frontend

## Pré-requisitos

- Node.js 20+
- Um banco PostgreSQL — recomendado usar um provedor gratuito na nuvem como [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (nenhuma instalação local necessária)

## Configuração inicial

1. Instale as dependências (na raiz do projeto, instala backend + frontend + shared de uma vez):
   ```
   npm install
   ```

2. Copie `.env.example` e configure:
   - `backend/.env` — cole sua `DATABASE_URL` do Neon/Supabase e ajuste os demais valores (veja `.env.example` na raiz para a lista completa)
   - `frontend/.env` — já vem pronto para desenvolvimento local (`VITE_API_URL`)

3. Rode as migrations do banco e popule com dados de exemplo:
   ```
   npm run prisma:migrate --workspace backend
   npm run prisma:seed
   ```
   Isso cria 2 usuários de teste (impressos no console) e alguns clientes/peças/serviços/ordens de exemplo.

4. Inicie o backend e o frontend (em terminais separados):
   ```
   npm run dev:backend
   npm run dev:frontend
   ```

5. Acesse `http://localhost:5173` no navegador.

## Testes automatizados

```
npm run test --workspace backend
```

## Documentação

- Manual de utilização (para quem opera o sistema no dia a dia): `manual/MANUAL_DE_UTILIZACAO.md`
- Plano de arquitetura e decisões técnicas: código comentado nos pontos não-óbvios (ver `backend/src/modules/estoque/movimentacao.service.ts`, `backend/src/modules/ordens/ordens.service.ts`, `backend/src/modules/whatsapp/whatsapp.client.ts`)
