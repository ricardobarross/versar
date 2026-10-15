-- Pedidos criados no painel também reservam estoque.
--
-- admin_create_order(cliente, status, pagamento, notas, itens):
--   itens = [{ "product_id", "variation_id"?, "quantity", "unit_price"? }]
--   * só admins (verificado aqui e pelo RLS — a função corre como quem chama);
--   * com variation_id: bloqueia a variação, valida e dá baixa no estoque;
--   * sem variation_id: produto sem variações, não mexe em estoque;
--   * unit_price opcional (desconto manual); por omissão usa o preço da base.
-- Tudo numa transação. Cancelar o pedido devolve o estoque (trigger existente).

create or replace function public.admin_create_order(
  p_customer_id    uuid,
  p_status         text,
  p_payment_method text,
  p_notes          text,
  p_items          jsonb
)
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_numero   bigint;
  v_total    numeric(12,2) := 0;
  v_reserved boolean := false;
  v_item     jsonb;
  v_qty      integer;
  v_price    numeric(12,2);
  v_product  uuid;
  v          record;
  p          record;
begin
  if not public.is_admin() then
    raise exception 'ORDER:FORBIDDEN';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'ORDER:EMPTY';
  end if;
  if coalesce(p_status, 'new') = 'canceled' then
    raise exception 'ORDER:INVALID_STATUS';
  end if;

  insert into public.orders (customer_id, status, total, payment_method, origin, notes)
  values (p_customer_id, coalesce(p_status, 'new'), 0, nullif(p_payment_method, ''), 'painel', nullif(p_notes, ''))
  returning id, numero into v_order_id, v_numero;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 then
      raise exception 'ORDER:INVALID_QUANTITY';
    end if;

    if nullif(v_item->>'variation_id', '') is not null then
      select pv.id, pv.product_id, pv.stock, pv.color, pv.size,
             coalesce(pv.price, pr.promo_price, pr.price) as unit_price, pr.name
        into v
        from public.product_variations pv
        join public.products pr on pr.id = pv.product_id
       where pv.id = (v_item->>'variation_id')::uuid
         for update of pv;

      if not found then
        raise exception 'ORDER:UNAVAILABLE:%', v_item->>'variation_id';
      end if;
      if v.stock < v_qty then
        raise exception 'ORDER:OUT_OF_STOCK:%',
          v.name || coalesce(' (' || nullif(concat_ws(' / ', v.color, v.size), '') || ')', '') || ' — disponível: ' || v.stock;
      end if;

      update public.product_variations set stock = stock - v_qty where id = v.id;
      insert into public.inventory_movements (product_id, variation_id, type, quantity, note)
      values (v.product_id, v.id, 'out', v_qty, 'Pedido #' || v_numero || ' (painel)');

      v_product  := v.product_id;
      v_price    := coalesce((v_item->>'unit_price')::numeric, v.unit_price);
      v_reserved := true;

      insert into public.order_items (order_id, product_id, variation_id, quantity, unit_price)
      values (v_order_id, v_product, v.id, v_qty, v_price);
    else
      select pr.id, coalesce(pr.promo_price, pr.price) as unit_price
        into p
        from public.products pr
       where pr.id = (v_item->>'product_id')::uuid;
      if not found then
        raise exception 'ORDER:UNAVAILABLE:%', v_item->>'product_id';
      end if;

      v_price := coalesce((v_item->>'unit_price')::numeric, p.unit_price);
      insert into public.order_items (order_id, product_id, quantity, unit_price)
      values (v_order_id, p.id, v_qty, v_price);
    end if;

    if v_price < 0 then
      raise exception 'ORDER:INVALID_PRICE';
    end if;
    v_total := v_total + v_price * v_qty;
  end loop;

  update public.orders
     set total = v_total, stock_reserved = v_reserved
   where id = v_order_id;

  return json_build_object('order_id', v_order_id, 'numero', v_numero, 'total', v_total);
end;
$$;

revoke execute on function public.admin_create_order(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.admin_create_order(uuid, text, text, text, jsonb) to authenticated;
