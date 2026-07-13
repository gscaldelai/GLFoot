# GLfoot — Plano de trabalho: autenticação em produção

## Situação atual (dev / offline)

Login e cadastro funcionam **localmente** (`src/stores/useAuthStore.ts`):

- O store tenta primeiro o backend real (`VITE_API_URL`, default `http://localhost:3001`).
- Se o backend estiver inacessível (conexão recusada, DNS, CORS ou timeout de 3,5s),
  cai num **fallback local**: a conta vira um perfil no `localStorage`
  (`glfoot-local-users`) e o usuário loga normalmente (`token: 'local'`).
- Erros de HTTP legítimos do backend (ex.: "e-mail já cadastrado") **não** caem no
  fallback — são propagados para a UI.
- O ranking já seguia esse padrão (usa dados MOCK quando o backend não responde).

Isso combina com o modo carreira ser offline. **Nada precisa rodar** para jogar localmente.

> Consequência: contas locais não sincronizam entre dispositivos e o ranking global
> fica em MOCK. Para contas reais + ranking real, é preciso o backend abaixo.

## O que falta para produção (backend real com Postgres)

O backend já existe em `backend/` (Express + `pg` + JWT). Passos para colocá-lo no ar:

1. **Provisionar um PostgreSQL** (Railway, Neon, Supabase, RDS ou local).
   - O schema é criado sozinho no boot (`backend/db.js` → `initDB`): tabelas `users` e
     `seasons` + extensão `pgcrypto`. Nenhuma migração manual necessária.
2. **Instalar as deps do backend**: `cd backend && npm install`.
3. **Criar `backend/.env`** a partir de `backend/.env.example`:
   ```
   DATABASE_URL=postgresql://user:senha@host:5432/glfoot
   JWT_SECRET=<segredo forte, ≥32 chars>
   FRONTEND_URL=<url do front em prod>   # CORS
   NODE_ENV=production
   PORT=3001
   ```
4. **Subir o backend**: `cd backend && npm start` (ou `npm run dev` com nodemon).
   - Health check: `GET /health` → `{ ok: true }`.
5. **Apontar o front para o backend**: definir `VITE_API_URL` no ambiente de build do
   front (ex.: `VITE_API_URL=https://glfoot-api.up.railway.app`).
   - Com o backend no ar, o caminho de API assume e o fallback local nunca é acionado.
6. **(Opcional) Deploy**: o backend já está preparado para Railway (health check + CORS
   por `FRONTEND_URL` + SSL em `NODE_ENV=production`). Lembrar que serviços Railway do
   workspace costumam ficar pausados para economizar — despausar antes de testar.

## Checklist de corte para produção

- [ ] Postgres provisionado e `DATABASE_URL` válido
- [ ] `backend/.env` criado (com `JWT_SECRET` forte)
- [ ] `cd backend && npm install`
- [ ] Backend responde em `/health`
- [ ] `VITE_API_URL` do front apontando para o backend
- [ ] Cadastro/login testados contra o backend real (sem cair no fallback)
- [ ] Migrar/decidir o que fazer com as contas locais criadas em dev (descartáveis)
