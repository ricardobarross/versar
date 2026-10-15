# API — VERSAR

## Autenticação

Todas as rotas marcadas com 🔒 exigem um **administrador ativo** (`public.admins`):

- no painel: a sessão do Supabase (cookies) é enviada automaticamente;
- integrações externas: `Authorization: Bearer <access_token do Supabase>`.

Respostas de erro: `{ "success": false, "error": "mensagem" }` com 400/401/403/404/500.
Os campos aceites em POST/PUT estão listados em `src/lib/fields.ts`; outros são ignorados.

## Públicas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/busca?q=` | Produtos ativos cujo nome contém `q` (máx. 20) |
| POST | `/api/checkout` | Cria o pedido da loja. Corpo: `{ cliente: {nome, whatsapp, email?, cpf?, endereco, cidade, estado, cep}, itens: [{variacaoId, quantidade}] }`. Preço, total e estoque são calculados no servidor. 409 se faltar estoque. |
| POST | `/api/webhooks` | Eventos externos, assinados com HMAC (ver abaixo) |

## Painel 🔒

| Recurso | Rotas |
|---|---|
| Produtos | `GET/POST /api/products` · `GET/PUT/DELETE /api/products/{id}` · `POST /api/products/{id}/toggle` (ativa/desativa) |
| Fotos | `GET/POST /api/products/{id}/fotos` · `GET/POST/PUT/DELETE /api/product-gallery` |
| Variações | `GET/POST /api/products/{id}/variacoes` · `GET/POST/PUT/DELETE /api/product-variations` |
| Estoque | `POST /api/products/variacoes/{id}/stock` `{operacao: "add"\|"set", valor}` · `GET/POST/DELETE /api/inventory` |
| Categorias | `GET/POST/PUT/DELETE /api/categories` |
| Clientes | `GET/POST /api/customers` · `GET/PUT/DELETE /api/customers/{id}` |
| Fornecedores | `GET/POST /api/suppliers` · `GET/PUT/DELETE /api/suppliers/{id}` |
| Pedidos | `GET/POST /api/orders` · `GET/PUT/DELETE /api/orders/{id}` · `GET/PUT /api/orders/{id}/status` |
| Destaques | `GET/POST /api/destaques` · `DELETE /api/destaques/{id}` |
| Configurações | `GET/PUT /api/configuracoes-loja` |
| Upload | `POST /api/upload` (FormData `file`, imagem até 5 MB) |
| Indicadores | `GET /api/dashboard` · `GET /api/relatorios` |
| IA | `GET /api/ia/briefing-diario` · `GET /api/ia/sugestoes-cliente?cliente_id=` · `GET /api/secretaria/{cliente\|produto}/{id}` |

### Status de pedido

`new` · `confirmed` · `paid` · `picking` · `shipped` · `delivered` · `canceled`
(rótulos em `src/lib/orders.ts`). Cancelar um pedido feito na loja devolve o estoque.

## Webhooks

`POST /api/webhooks` — desligado enquanto `WEBHOOK_SECRET` não estiver definido.

Assine o **corpo bruto** com HMAC-SHA256 e envie o hex em `x-webhook-signature`:

```bash
BODY='{"tipo":"pagamento_aprovado","pedido_id":"<uuid>"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | cut -d' ' -f2)
curl -X POST https://<loja>/api/webhooks -H "content-type: application/json" -H "x-webhook-signature: $SIG" -d "$BODY"
```

| `tipo` | Efeito |
|---|---|
| `pagamento_aprovado` | pedido → `paid` |
| `pagamento_cancelado` | pedido → `canceled` (devolve estoque) |
| `pedido_enviado` | pedido → `shipped` |
| `mensagem_whatsapp` | grava `{numero, mensagem}` em `mensagens_whatsapp` |

Todos os eventos ficam em `webhook_logs`.
