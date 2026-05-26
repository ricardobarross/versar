# 📘 Documentação da API — Loja Ricardo

API completa para e-commerce, incluindo produtos, pedidos, clientes, fornecedores, uploads, autenticação e webhooks.

---

## 🔐 Autenticação (Admin)

### Login
`POST /api/auth/login`

### Logout
`POST /api/auth/logout`

### Verificar sessão
`GET /api/auth/me`

### Criar admin
`POST /api/auth/register`

---

## 🛍️ Produtos

### Listar produtos
`GET /api/produtos`

### Criar produto
`POST /api/produtos`

### Buscar produto
`GET /api/produtos/{id}`

### Atualizar produto
`PUT /api/produtos/{id}`

### Remover produto
`DELETE /api/produtos/{id}`

---

## ⭐ Destaques

### Listar destaques
`GET /api/destaques`

### Criar destaque
`POST /api/destaques`

### Remover destaque
`DELETE /api/destaques/{id}`

---

## 🔎 Busca Avançada

`GET /api/busca`

Parâmetros:
- `q`
- `categoria`
- `fornecedor`
- `preco_min`
- `preco_max`
- `ativo`
- `ordenar`
- `direcao`
- `pagina`
- `limite`

---

## 📦 Pedidos

### Listar pedidos
`GET /api/pedidos`

### Criar pedido
`POST /api/pedidos`

### Buscar pedido
`GET /api/pedidos/{id}`

### Atualizar pedido
`PUT /api/pedidos/{id}`

### Remover pedido
`DELETE /api/pedidos/{id}`

### Status do pedido
`GET /api/pedidos/{id}/status`  
`PUT /api/pedidos/{id}/status`

---

## 👤 Clientes

`GET /api/clientes`  
`POST /api/clientes`  
`GET /api/clientes/{id}`  
`PUT /api/clientes/{id}`  
`DELETE /api/clientes/{id}`  

---

## 🏭 Fornecedores

`GET /api/fornecedores`  
`POST /api/fornecedores`  
`GET /api/fornecedores/{id}`  
`PUT /api/fornecedores/{id}`  
`DELETE /api/fornecedores/{id}`  

---

## 🏪 Configurações da Loja

`GET /api/configuracoes-loja`  
`PUT /api/configuracoes-loja`  

---

## 📤 Upload de Imagens

`POST /api/upload`

Enviar via FormData:

Retorna URL pública.

---

## 🔔 Webhooks

`POST /api/webhooks`

Suporta:
- pagamento_aprovado  
- pagamento_cancelado  
- pedido_enviado  
- mensagem_whatsapp  
- outros eventos personalizados  

Logs em `webhook_logs`.

---

## 📊 Dashboard

`GET /api/dashboard`

Retorna:
- totalPedidos  
- totalVendas  
- totalClientes  
- pedidosPorStatus  
- faturamentoUltimos7Dias  
- topProdutos  

---

## 📈 Relatórios

`GET /api/relatorios?tipo=...`

Tipos:
- vendas_totais  
- pedidos_por_status  
- produtos_mais_vendidos  
- faturamento_por_dia  
