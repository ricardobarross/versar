-- VERSAR — dados de exemplo (fictícios) para testar a loja e o painel

insert into public.store_settings (id, store_name, whatsapp, banner_title, banner_subtitle, instagram)
values (1, 'VERSAR', '5581999990000', 'Nova coleção', 'Moda masculina com atitude', '@versar')
on conflict (id) do nothing;

insert into public.categories (name, slug, description) values
  ('Camisas',    'camisas',    'Camisas sociais e casuais'),
  ('Camisetas',  'camisetas',  'Camisetas básicas e estampadas'),
  ('Polos',      'polos',      'Camisas polo'),
  ('Calças',     'calcas',     'Jeans, sarja e alfaiataria'),
  ('Bermudas',   'bermudas',   'Bermudas de sarja e jeans'),
  ('Acessórios', 'acessorios', 'Cintos, bonés e carteiras');

insert into public.suppliers (name, contact, phone, email, address, notes) values
  ('Confecções Recife Ltda', 'Marcos', '(81) 3333-1000', 'vendas@confeccoesrecife.example', 'Recife - PE', 'Prazo de entrega 15 dias'),
  ('Têxtil Caruaru',         'Juliana', '(81) 3722-2000', 'comercial@textilcaruaru.example', 'Caruaru - PE', 'Pedido mínimo 50 peças');

with c as (select id, slug from public.categories),
     s as (select id, name from public.suppliers)
insert into public.products (name, slug, description, price, promo_price, category_id, supplier_id, is_featured, stock, min_stock)
select v.name, v.slug, v.description, v.price, v.promo, c.id, s.id, v.featured, v.stock, 5
from (values
  ('Camisa Oxford Branca',      'camisa-oxford-branca',      'Camisa oxford 100% algodão, corte slim.',          189.90, null::numeric, 'camisas',    'Confecções Recife Ltda', true,  24),
  ('Camisa Linho Azul',         'camisa-linho-azul',         'Camisa de linho, ideal para o verão.',             229.90, 199.90,        'camisas',    'Confecções Recife Ltda', true,  12),
  ('Camiseta Básica Preta',     'camiseta-basica-preta',     'Camiseta de algodão penteado, gola careca.',        59.90, null,          'camisetas',  'Têxtil Caruaru',         false, 40),
  ('Camiseta Estampada Versar', 'camiseta-estampada-versar', 'Camiseta com estampa exclusiva VERSAR.',            79.90,  69.90,        'camisetas',  'Têxtil Caruaru',         true,  30),
  ('Polo Piquet Marinho',       'polo-piquet-marinho',       'Polo em malha piquet com bordado no peito.',       129.90, null,          'polos',      'Têxtil Caruaru',         false, 18),
  ('Calça Jeans Slim',          'calca-jeans-slim',          'Jeans com elastano, lavagem escura.',              199.90, 179.90,        'calcas',     'Confecções Recife Ltda', true,  20),
  ('Calça Chino Bege',          'calca-chino-bege',          'Calça chino em sarja, corte reto.',                169.90, null,          'calcas',     'Confecções Recife Ltda', false, 15),
  ('Bermuda Sarja Caqui',       'bermuda-sarja-caqui',       'Bermuda de sarja com bolsos laterais.',            109.90,  89.90,        'bermudas',   'Têxtil Caruaru',         false, 22),
  ('Cinto Couro Marrom',        'cinto-couro-marrom',        'Cinto em couro legítimo, fivela niquelada.',        89.90, null,          'acessorios', 'Confecções Recife Ltda', false, 10),
  ('Boné Versar Preto',         'bone-versar-preto',         'Boné aba curva com logo bordado.',                  69.90, null,          'acessorios', 'Têxtil Caruaru',         false,  3)
) as v(name, slug, description, price, promo, cat_slug, supplier_name, featured, stock)
join c on c.slug = v.cat_slug
join s on s.name = v.supplier_name;

-- variações: tamanhos P/M/G/GG para roupas, cor única; acessórios tamanho único
insert into public.product_variations (product_id, name, color, size, stock)
select p.id, coalesce(sz.size, 'Único'),
       case
         when p.slug like '%branca%' then 'Branco'
         when p.slug like '%azul%' or p.slug like '%marinho%' or p.slug like '%jeans%' then 'Azul'
         when p.slug like '%preta%' or p.slug like '%preto%' or p.slug like '%versar' then 'Preto'
         when p.slug like '%bege%' or p.slug like '%caqui%' then 'Bege'
         when p.slug like '%marrom%' then 'Marrom'
         else 'Preto'
       end,
       sz.size,
       greatest(1, p.stock / 4)
from public.products p
join public.categories c on c.id = p.category_id
left join lateral (
  select unnest(case
    when c.slug = 'acessorios' then array[null::text]
    when c.slug in ('calcas','bermudas') then array['38','40','42','44']
    else array['P','M','G','GG'] end) as size
) sz on true;

insert into public.customers (name, whatsapp, phone, email, cpf, address, city, state, zip_code) values
  ('Carlos Mendes',  '81988887777', '81988887777', 'carlos@example.com',  '111.222.333-44', 'Rua da Aurora, 100',     'Recife',   'PE', '50050-000'),
  ('Rafael Souza',   '81977776666', '81977776666', 'rafael@example.com',  '222.333.444-55', 'Av. Agamenon, 2500',     'Recife',   'PE', '52020-000'),
  ('Bruno Almeida',  '81966665555', '81966665555', 'bruno@example.com',   '333.444.555-66', 'Rua do Sol, 45',         'Olinda',   'PE', '53020-000'),
  ('Thiago Lima',    '81955554444', '81955554444', 'thiago@example.com',  '444.555.666-77', 'Rua Vigário Freire, 12', 'Caruaru',  'PE', '55002-000');

-- pedidos de exemplo
with ord as (
  insert into public.orders (customer_id, status, total, payment_method, origin, created_at)
  select c.id, v.status, 0, v.pay, v.origin, now() - (v.days || ' days')::interval
  from (values
    ('Carlos Mendes', 'concluido', 'pix',       'loja_online', 40),
    ('Carlos Mendes', 'pago',      'cartão',    'whatsapp',     6),
    ('Rafael Souza',  'novo',      'a combinar','loja_online',  1),
    ('Bruno Almeida', 'enviado',   'pix',       'whatsapp',     3)
  ) as v(cust, status, pay, origin, days)
  join public.customers c on c.name = v.cust
  returning id, customer_id, created_at
)
insert into public.order_items (order_id, product_id, variation_id, quantity, unit_price)
select o.id, p.id, pv.id, it.qty, coalesce(p.promo_price, p.price)
from ord o
join public.customers c on c.id = o.customer_id
join (values
  ('Carlos Mendes', 40, 'camisa-oxford-branca', 'M', 2),
  ('Carlos Mendes', 40, 'calca-jeans-slim',     '42', 1),
  ('Carlos Mendes',  6, 'polo-piquet-marinho',  'G', 1),
  ('Rafael Souza',   1, 'camiseta-estampada-versar', 'M', 3),
  ('Bruno Almeida',  3, 'bermuda-sarja-caqui',  '40', 2),
  ('Bruno Almeida',  3, 'cinto-couro-marrom',   null, 1)
) as it(cust, days, slug, size, qty)
  on it.cust = c.name and o.created_at::date = (now() - (it.days || ' days')::interval)::date
join public.products p on p.slug = it.slug
left join public.product_variations pv on pv.product_id = p.id and pv.size is not distinct from it.size;

update public.orders o
set total = coalesce((select sum(oi.quantity * oi.unit_price) from public.order_items oi where oi.order_id = o.id), 0)
where o.total = 0;

insert into public.accounts_payable (descricao, valor, data_vencimento, status) values
  ('Fatura Confecções Recife', 2350.00, current_date - 2, 'atrasado'),
  ('Aluguel da loja',          1800.00, current_date,     'pendente'),
  ('Têxtil Caruaru - lote 12', 1240.00, current_date + 10,'pendente');

insert into public.destaques (product_id, ordem)
select id, row_number() over (order by name) from public.products where is_featured;
