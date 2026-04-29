# VERSAR — Checklist de Deploy em Produção

## 1. PROBLEMA CRÍTICO: app/page.tsx

**O ficheiro `src/app/page.tsx` DEVE SER APAGADO.**

Com o Route Group `(loja)`, o Next.js 14 usa `src/app/(loja)/page.tsx` para a rota `/`.
Se `src/app/page.tsx` existir ao mesmo tempo, o build falha com:
> "You cannot have two parallel pages that resolve to the same path."

**Ação:** Apagar `C:\PASTA DO SISTEMA\versar\src\app\page.tsx`

---

## 2. Ficheiros criados nesta sessão

Substitui estes ficheiros no teu projeto:

| Caminho | Estado |
|---|---|
| `src/app/(loja)/page.tsx` | ✅ Novo — homepage da loja |
| `src/app/(loja)/layout.tsx` | ✅ Novo — layout da loja |
| `src/app/(loja)/produtos/page.tsx` | ✅ Novo — listagem de produtos |
| `src/app/(loja)/produtos/[slug]/page.tsx` | ✅ Novo — detalhe de produto |
| `src/components/loja/PaginaProduto.tsx` | ✅ Novo — componente de produto |
| `src/components/loja/Navbar.tsx` | ✅ Novo — navbar da loja |
| `src/components/admin/AdminSidebar.tsx` | ✅ Actualizado — adicionado link Categorias + ícone Tag |
| `src/app/admin/page.tsx` | ✅ Novo — dashboard com estatísticas |
| `src/app/admin/layout.tsx` | ✅ Novo — layout admin |
| `src/app/auth/login/page.tsx` | ✅ Novo — página de login |
| `src/middleware.ts` | ✅ Novo — proteção de rotas /admin |
| `src/lib/supabase/client.ts` | ✅ Novo |
| `src/lib/supabase/server.ts` | ✅ Novo |
| `src/types/index.ts` | ✅ Novo — tipos TypeScript completos |

---

## 3. Variáveis de Ambiente no Vercel

Confirma que estas variáveis estão configuradas em vercel.com → Projeto → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://zyggbvhumzeymqjbyava.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 4. Supabase — Verificações

### 4.1 RLS (Row Level Security)

Vai a Supabase → Authentication → Policies e confirma:

- **produtos**: SELECT público (sem autenticação) para `ativo = true`
- **categorias**: SELECT público para `ativo = true`
- **configuracoes_loja**: SELECT público
- **produto_fotos**: SELECT público
- **produto_variacoes**: SELECT público
- **clientes**: Apenas autenticados
- **pedidos**: Apenas autenticados
- **pedido_itens**: Apenas autenticados

### 4.2 Storage Bucket

- Bucket `versar-fotos` deve ter acesso público para leitura
- Vai a Supabase → Storage → versar-fotos → Policies
- Adicionar policy: `SELECT` para `public` (todos os utilizadores)

### 4.3 Tabela configuracoes_loja

Se a tabela estiver vazia, o layout vai usar valores padrão mas não vai quebrar.
Recomendado: inserir uma linha com os dados da loja.

```sql
INSERT INTO configuracoes_loja (nome_loja, descricao, email)
VALUES ('VERSAR', 'Moda Masculina', 'info@versar.com');
```

---

## 5. Testar Localmente Antes do Deploy

```bash
cd "C:\PASTA DO SISTEMA\versar"
npm run build
```

Se o build passar sem erros, está pronto para deploy.

```bash
npm run dev
```

Testar manualmente:
- [ ] `/` — homepage da loja carrega
- [ ] `/produtos` — listagem de produtos
- [ ] `/produtos/[slug]` — detalhe de produto (usar slug de um produto real)
- [ ] `/auth/login` — página de login
- [ ] `/admin` — redireciona para login se não autenticado
- [ ] `/admin` → login → dashboard carrega com estatísticas
- [ ] `/admin/produtos` — listagem
- [ ] `/admin/categorias` — listagem (verificar link na sidebar)
- [ ] `/admin/clientes` — listagem
- [ ] `/admin/fornecedores` — listagem
- [ ] `/admin/pedidos` — listagem
- [ ] `/admin/relatorios` — página
- [ ] `/admin/configuracoes` — página

---

## 6. Deploy no Vercel

### Opção A — GitHub (recomendado)
```bash
git add .
git commit -m "feat: loja pública completa + sidebar categorias + tipos TS"
git push origin main
```
O Vercel faz deploy automaticamente.

### Opção B — CLI
```bash
npx vercel --prod
```

---

## 7. Após Deploy — Testes em Produção

1. Abrir `versar.vercel.app` — homepage deve aparecer
2. Confirmar que `/admin` redireciona para `/auth/login`
3. Fazer login com as credenciais do Supabase Auth
4. Testar criação de produto, categoria, cliente, pedido
5. Verificar se fotos de produtos carregam (URLs do Supabase Storage)

---

## 8. Erros Comuns e Soluções

| Erro | Causa | Solução |
|---|---|---|
| Build falha com "two parallel pages" | `app/page.tsx` existe | Apagar esse ficheiro |
| Fotos não carregam | Bucket não público | Adicionar policy SELECT público no Storage |
| Admin acessível sem login | middleware.ts em falta | Confirmar que middleware.ts está na raiz de `src/` |
| `@supabase/auth-helpers-nextjs` not found | Dependência em falta | `npm install @supabase/auth-helpers-nextjs` |
| Tipos TypeScript em `@/types` | Path alias em falta | Confirmar `tsconfig.json` tem `"@/*": ["./src/*"]` |

---

## 9. tsconfig.json — Verificar Path Alias

O `tsconfig.json` deve ter:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 10. Dependências Necessárias

Confirmar que `package.json` tem:

```json
{
  "dependencies": {
    "next": "14.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/auth-helpers-nextjs": "^0.x",
    "lucide-react": "^0.x",
    "react": "^18.x",
    "react-dom": "^18.x"
  }
}
```

Se faltar alguma:
```bash
npm install @supabase/auth-helpers-nextjs lucide-react
```
