-- VERSAR — schema base (reconstruído a partir do código em src/)
-- Tabelas canónicas em inglês. Algumas colunas duplicadas existem porque
-- o código ainda usa nomes diferentes em sítios diferentes (ver comentários).

create extension if not exists pgcrypto;

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- admins ----------
create table public.admins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text,
  nome        text,               -- usado por /api/auth/register (legado)
  senha_hash  text,               -- usado por /api/auth/login (legado)
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- categories ----------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- suppliers ----------
create table public.suppliers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact     text,
  phone       text,
  email       text,
  address     text,
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- products ----------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  description text,
  price       numeric(12,2) not null default 0,
  promo_price numeric(12,2),
  category_id uuid references public.categories(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  is_active   boolean not null default true,
  is_featured boolean not null default false,
  stock       integer not null default 0,     -- usado pelo briefing diário
  min_stock   integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.products (category_id);
create index on public.products (supplier_id);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  "order"     integer not null default 0,
  ordem       integer generated always as ("order") stored, -- admin/produtos lê "ordem"
  is_main     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.product_images (product_id);

create table public.product_variations (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text,
  color       text,
  size        text,
  sku         text,
  price       numeric(12,2),
  stock       integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.product_variations (product_id);

create table public.product_gallery (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  image_url   text not null,
  alt_text    text,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.product_gallery (product_id);

create table public.destaques (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  ordem       integer not null default 0,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);
create index on public.destaques (product_id);

create table public.inventory_movements (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  variation_id uuid references public.product_variations(id) on delete set null,
  type         text not null default 'in',     -- in | out | adjust
  quantity     integer not null,
  note         text,
  created_at   timestamptz not null default now()
);
create index on public.inventory_movements (product_id);
create index on public.inventory_movements (variation_id);

-- ---------- customers ----------
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  whatsapp    text,
  email       text,
  document    text,
  cpf         text,
  address     text,
  city        text,
  state       text,
  zip_code    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index on public.customers (whatsapp);

-- ---------- orders ----------
-- status é texto livre: o código usa valores em PT e EN
-- (novo/pago/enviado/cancelado/concluido e new/pending/confirmed/shipped/completed/canceled).
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  numero         bigint generated always as identity unique,
  customer_id    uuid references public.customers(id) on delete set null,
  status         text not null default 'novo',
  total          numeric(12,2) not null default 0,
  payment_method text,
  origin         text not null default 'whatsapp',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public.orders (customer_id);
create index on public.orders (created_at desc);

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  variation_id uuid references public.product_variations(id) on delete set null,
  quantity     integer not null default 1,
  price        numeric(12,2),     -- usado pelo admin
  unit_price   numeric(12,2),     -- usado pelo checkout / API
  created_at   timestamptz not null default now()
);
create index on public.order_items (order_id);
create index on public.order_items (product_id);
create index on public.order_items (variation_id);

-- mantém price e unit_price sincronizados
create or replace function public.order_items_sync_price()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.price := coalesce(new.price, new.unit_price);
  new.unit_price := coalesce(new.unit_price, new.price);
  return new;
end $$;
create trigger order_items_sync_price before insert or update on public.order_items
  for each row execute function public.order_items_sync_price();

-- ---------- financeiro ----------
create table public.accounts_payable (
  id               uuid primary key default gen_random_uuid(),
  descricao        text not null,
  valor            numeric(12,2) not null,
  data_vencimento  date not null,
  status           text not null default 'pendente', -- pendente | pago | atrasado
  created_at       timestamptz not null default now()
);

-- ---------- configurações (linha única, id = 1) ----------
create table public.store_settings (
  id              integer primary key default 1 check (id = 1),
  store_name      text not null default 'VERSAR',
  whatsapp        text,
  banner_title    text,
  banner_subtitle text,
  banner_url      text,
  primary_color   text,
  instagram       text,
  facebook        text,
  created_at      timestamptz not null default now()
);

-- ---------- integrações ----------
create table public.webhook_logs (
  id          uuid primary key default gen_random_uuid(),
  tipo        text,
  payload     jsonb,
  recebido_em timestamptz not null default now(),
  processado  boolean not null default false,
  erro        text
);

create table public.mensagens_whatsapp (
  id          uuid primary key default gen_random_uuid(),
  numero      text,
  mensagem    text,
  recebido_em timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
create trigger t_admins_upd   before update on public.admins             for each row execute function public.set_updated_at();
create trigger t_products_upd before update on public.products           for each row execute function public.set_updated_at();
create trigger t_variations_upd before update on public.product_variations for each row execute function public.set_updated_at();
create trigger t_gallery_upd  before update on public.product_gallery    for each row execute function public.set_updated_at();
create trigger t_orders_upd   before update on public.orders             for each row execute function public.set_updated_at();
