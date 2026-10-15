# VERSAR — Loja e painel de gestão

Loja online de moda masculina com painel administrativo (produtos, estoque, pedidos,
clientes, fornecedores, relatórios e Secretária Inteligente).

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Vercel

## Estrutura

```
src/
  app/(loja)/        loja pública: início, produtos, categoria, carrinho, checkout
  app/admin/         painel (só para utilizadores em public.admins)
  app/auth/login/    login do painel (Supabase Auth)
  app/api/           rotas de API (ver API.md)
  components/        componentes da loja e do painel
  lib/
    api.ts           requireAdmin(), erros e validação das rotas
    loja.ts          consultas e tipos da loja pública
    orders.ts        status de pedido (fonte única)
    supabase/        clientes Supabase (browser, servidor, service role)
supabase/
  migrations/        schema, RLS, funções — aplicar por ordem
  seed.sql           dados de exemplo
```

## Configuração local

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha com as chaves do Supabase
   (Project Settings → API Keys).
3. `npm run dev` → http://localhost:3000

## Base de dados

As migrations em `supabase/migrations` criam tudo (tabelas, RLS, funções, buckets).
Num projeto novo, aplique-as por ordem no SQL Editor (ou com `supabase db push`)
e depois, se quiser dados de exemplo, o `supabase/seed.sql`.

Regras de acesso (RLS):

- **Visitantes** só leem o catálogo ativo e as configurações da loja.
- **Admins** (tabela `public.admins`) têm acesso total.
- O **checkout** corre no servidor com a service role e chama a função
  `checkout_create_order`, que calcula preços, valida e dá baixa no estoque numa
  única transação. Cancelar um pedido devolve o estoque automaticamente.

## Dar acesso ao painel

1. Registe o e-mail como admin (SQL Editor):
   ```sql
   insert into public.admins (email, name) values ('email@exemplo.com', 'Nome');
   ```
2. Crie o utilizador em **Authentication → Users → Add user** com
   *Auto Confirm User* ligado. A ligação ao admin é automática.
3. Em **Authentication → Sign In / Providers**, desligue *Allow new users to sign up*.

## Deploy (Vercel)

Variáveis de ambiente necessárias: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
Opcionais: `NEXT_PUBLIC_SITE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `WEBHOOK_SECRET`.

O build verifica tipos e lint — corra `npx tsc --noEmit` antes de enviar.
