-- VERSAR — views de compatibilidade (PT), funções RPC, RLS e storage

-- =====================================================================
-- Views em português: a loja pública (src/app/(loja)) e o webhook ainda
-- consultam os nomes antigos. Estas views apontam para as tabelas novas,
-- respeitam o RLS (security_invoker) e podem ser removidas quando o
-- código estiver todo migrado para os nomes em inglês.
-- =====================================================================
create view public.categorias with (security_invoker = on) as
  select id, name as nome, slug, description as descricao, is_active as ativo, created_at
  from public.categories;

create view public.produtos with (security_invoker = on) as
  select id, name as nome, slug, description as descricao,
         price as preco, promo_price as preco_promocional,
         category_id as categoria_id, supplier_id as fornecedor_id,
         is_active as ativo, is_featured as destaque, created_at
  from public.products;

create view public.produto_fotos with (security_invoker = on) as
  select id, product_id as produto_id, url, "order" as ordem, is_main as principal
  from public.product_images;

create view public.produto_variacoes with (security_invoker = on) as
  select id, product_id as produto_id, color as cor, size as tamanho, stock as estoque
  from public.product_variations;

create view public.configuracoes_loja with (security_invoker = on) as
  select id, store_name as nome_loja, whatsapp,
         banner_title as banner_titulo, banner_subtitle as banner_subtitulo,
         banner_url, instagram, facebook
  from public.store_settings;

-- view simples => atualizável (usada pelo /api/webhooks)
create view public.pedidos with (security_invoker = on) as
  select id, customer_id as cliente_id, status, total, created_at, updated_at
  from public.orders;

-- =====================================================================
-- Funções
-- =====================================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    where a.user_id = auth.uid() and a.is_active
  );
$$;

create or replace function public.inventory_balance()
returns table (product_id uuid, variation_id uuid, balance bigint)
language sql stable set search_path = '' as $$
  select m.product_id, m.variation_id,
         sum(case when m.type = 'out' then -m.quantity else m.quantity end)::bigint
  from public.inventory_movements m
  group by m.product_id, m.variation_id;
$$;

create or replace function public.customer_favorite_product(customer_id_input uuid)
returns json language sql stable set search_path = '' as $$
  select json_build_object('product_name', p.name, 'quantity', sum(oi.quantity))
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.products p on p.id = oi.product_id
  where o.customer_id = customer_id_input
  group by p.name
  order by sum(oi.quantity) desc
  limit 1;
$$;

create or replace function public.customer_favorite_category(customer_id_input uuid)
returns json language sql stable set search_path = '' as $$
  select json_build_object('category_name', c.name, 'quantity', sum(oi.quantity))
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.products p on p.id = oi.product_id
  join public.categories c on c.id = p.category_id
  where o.customer_id = customer_id_input
  group by c.name
  order by sum(oi.quantity) desc
  limit 1;
$$;

create or replace function public.customer_average_ticket(customer_id_input uuid)
returns json language sql stable set search_path = '' as $$
  select json_build_object('average', coalesce(round(avg(o.total), 2), 0), 'orders', count(*))
  from public.orders o
  where o.customer_id = customer_id_input
    and o.status not in ('cancelado', 'canceled', 'cancelled');
$$;

create or replace function public.customers_with_last_order()
returns table (
  id uuid, name text, phone text, last_order_date timestamptz,
  favorite_product text, days_without_purchase integer
)
language sql stable set search_path = '' as $$
  select c.id, c.name, coalesce(c.whatsapp, c.phone),
         lo.last_order,
         (public.customer_favorite_product(c.id) ->> 'product_name'),
         case when lo.last_order is null then 9999
              else (current_date - lo.last_order::date) end
  from public.customers c
  left join lateral (
    select max(o.created_at) as last_order from public.orders o where o.customer_id = c.id
  ) lo on true;
$$;

-- =====================================================================
-- RLS
-- Regras: admins (tabela public.admins, ligada ao auth.users) podem tudo;
-- visitantes só leem o catálogo e as configurações da loja.
-- Clientes, pedidos e financeiro NÃO são legíveis pelo público.
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'admins','categories','suppliers','products','product_images','product_variations',
    'product_gallery','destaques','inventory_movements','customers','orders','order_items',
    'accounts_payable','store_settings','webhook_logs','mensagens_whatsapp'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "admin full access" on public.%I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end $$;

-- o próprio admin consegue ler o seu registo (usado por requireAdmin)
create policy "admin reads own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- catálogo público
create policy "public read active categories" on public.categories
  for select to anon, authenticated using (is_active);
create policy "public read active products" on public.products
  for select to anon, authenticated using (is_active);
create policy "public read product images" on public.product_images
  for select to anon, authenticated using (true);
create policy "public read product variations" on public.product_variations
  for select to anon, authenticated using (true);
create policy "public read product gallery" on public.product_gallery
  for select to anon, authenticated using (true);
create policy "public read destaques" on public.destaques
  for select to anon, authenticated using (ativo);
create policy "public read store settings" on public.store_settings
  for select to anon, authenticated using (true);

-- =====================================================================
-- Storage: buckets usados pelo código (públicos para leitura)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true),
       ('versar-photos', 'versar-photos', true),
       ('versar-fotos', 'versar-fotos', true)
on conflict (id) do nothing;

create policy "admins upload versar files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('uploads','versar-photos','versar-fotos') and (select public.is_admin()));
create policy "admins update versar files" on storage.objects
  for update to authenticated
  using (bucket_id in ('uploads','versar-photos','versar-fotos') and (select public.is_admin()));
create policy "admins delete versar files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('uploads','versar-photos','versar-fotos') and (select public.is_admin()));
