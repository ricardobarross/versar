-- Logótipo da loja (usado no cabeçalho da loja e nas configurações)
alter table public.store_settings add column if not exists logo_url text;
