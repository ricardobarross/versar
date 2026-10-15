-- Checkout transacional com baixa de estoque
--
-- checkout_create_order(cliente, itens):
--   * preço sempre lido da base (variação > promoção > preço do produto);
--   * bloqueia as variações (FOR UPDATE) e valida o estoque;
--   * cria/atualiza o cliente pelo WhatsApp, o pedido e os itens;
--   * dá baixa no estoque e regista em inventory_movements.
-- Tudo numa transação: se um item falhar, nada é gravado.
-- Só a service role (rota /api/checkout no servidor) pode executar.

alter table public.orders
  add column if not exists stock_reserved boolean not null default false;

create or replace function public.checkout_create_order(p_customer jsonb, p_items jsonb)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_order_id    uuid;
  v_numero      bigint;
  v_total       numeric(12,2) := 0;
  v_lines       jsonb := '[]'::jsonb;
  v_item        jsonb;
  v_qty         integer;
  v             record;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'CHECKOUT:EMPTY_CART';
  end if;

  -- cliente (identificado pelo WhatsApp)
  select c.id into v_customer_id
  from public.customers c
  where c.whatsapp = p_customer->>'whatsapp'
  order by c.created_at
  limit 1;

  if v_customer_id is null then
    insert into public.customers (name, whatsapp, phone, email, cpf, address, city, state, zip_code)
    values (
      p_customer->>'name', p_customer->>'whatsapp', p_customer->>'whatsapp',
      nullif(p_customer->>'email', ''), nullif(p_customer->>'cpf', ''),
      p_customer->>'address', p_customer->>'city', p_customer->>'state', p_customer->>'zip_code'
    )
    returning id into v_customer_id;
  else
    update public.customers set
      name     = coalesce(nullif(p_customer->>'name', ''), name),
      email    = coalesce(nullif(p_customer->>'email', ''), email),
      cpf      = coalesce(nullif(p_customer->>'cpf', ''), cpf),
      address  = coalesce(nullif(p_customer->>'address', ''), address),
      city     = coalesce(nullif(p_customer->>'city', ''), city),
      state    = coalesce(nullif(p_customer->>'state', ''), state),
      zip_code = coalesce(nullif(p_customer->>'zip_code', ''), zip_code)
    where id = v_customer_id;
  end if;

  insert into public.orders (customer_id, status, total, payment_method, origin, stock_reserved)
  values (v_customer_id, 'new', 0, 'a combinar', 'loja_online', true)
  returning id, numero into v_order_id, v_numero;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 50 then
      raise exception 'CHECKOUT:INVALID_QUANTITY';
    end if;

    select pv.id, pv.product_id, pv.stock, pv.color, pv.size,
           coalesce(pv.price, p.promo_price, p.price) as unit_price,
           p.name, p.is_active, pv.is_active as variation_active
      into v
      from public.product_variations pv
      join public.products p on p.id = pv.product_id
     where pv.id = (v_item->>'variation_id')::uuid
       for update of pv;

    if not found then
      raise exception 'CHECKOUT:UNAVAILABLE:%', v_item->>'variation_id';
    end if;
    if not v.is_active or not v.variation_active then
      raise exception 'CHECKOUT:UNAVAILABLE:%', v.name;
    end if;
    if v.stock < v_qty then
      raise exception 'CHECKOUT:OUT_OF_STOCK:%',
        v.name || coalesce(' (' || nullif(concat_ws(' / ', v.color, v.size), '') || ')', '');
    end if;

    update public.product_variations set stock = stock - v_qty where id = v.id;

    insert into public.order_items (order_id, product_id, variation_id, quantity, unit_price)
    values (v_order_id, v.product_id, v.id, v_qty, v.unit_price);

    insert into public.inventory_movements (product_id, variation_id, type, quantity, note)
    values (v.product_id, v.id, 'out', v_qty, 'Pedido #' || v_numero);

    v_total := v_total + v.unit_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'name', v.name,
      'variation', concat_ws(' / ', v.color, v.size),
      'quantity', v_qty,
      'unit_price', v.unit_price
    );
  end loop;

  update public.orders set total = v_total where id = v_order_id;

  return json_build_object(
    'order_id', v_order_id,
    'numero', v_numero,
    'total', v_total,
    'items', v_lines
  );
end;
$$;

revoke execute on function public.checkout_create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.checkout_create_order(jsonb, jsonb) to service_role;

-- Cancelar um pedido do checkout devolve o estoque (e reativar volta a reservar).
create or replace function public.orders_restock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sign integer;
begin
  if not new.stock_reserved or new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'canceled' and old.status <> 'canceled' then
    v_sign := 1;   -- devolve
  elsif old.status = 'canceled' and new.status <> 'canceled' then
    v_sign := -1;  -- reserva de novo
  else
    return new;
  end if;

  update public.product_variations pv
     set stock = pv.stock + v_sign * oi.quantity
    from public.order_items oi
   where oi.order_id = new.id and pv.id = oi.variation_id;

  insert into public.inventory_movements (product_id, variation_id, type, quantity, note)
  select oi.product_id, oi.variation_id,
         case when v_sign = 1 then 'in' else 'out' end,
         oi.quantity,
         case when v_sign = 1 then 'Cancelamento do pedido #' else 'Reativação do pedido #' end || new.numero
    from public.order_items oi
   where oi.order_id = new.id and oi.variation_id is not null and oi.product_id is not null;

  return new;
end;
$$;

revoke execute on function public.orders_restock_on_cancel() from public, anon, authenticated;

create trigger orders_restock_on_cancel
  after update of status on public.orders
  for each row execute function public.orders_restock_on_cancel();
