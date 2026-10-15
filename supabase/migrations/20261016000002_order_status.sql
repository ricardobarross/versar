-- Status de pedido unificados (ver src/lib/orders.ts)
-- ATENÇÃO: aplicar só DEPOIS do deploy do código novo (o código antigo gravava "novo").

-- new | confirmed | paid | picking | shipped | delivered | canceled

update public.orders set status = case status
  when 'novo'       then 'new'
  when 'pending'    then 'new'
  when 'confirmado' then 'confirmed'
  when 'pago'       then 'paid'
  when 'separando'  then 'picking'
  when 'enviado'    then 'shipped'
  when 'entregue'   then 'delivered'
  when 'concluido'  then 'delivered'
  when 'completed'  then 'delivered'
  when 'cancelado'  then 'canceled'
  when 'cancelled'  then 'canceled'
  else status
end;

alter table public.orders alter column status set default 'new';
alter table public.orders add constraint orders_status_check
  check (status in ('new','confirmed','paid','picking','shipped','delivered','canceled'));

-- contas a pagar também passam a ter valores fixos
alter table public.accounts_payable add constraint accounts_payable_status_check
  check (status in ('pendente','pago','atrasado'));

-- funções que filtravam pelos nomes antigos
create or replace function public.customer_average_ticket(customer_id_input uuid)
returns json language sql stable set search_path = '' as $$
  select json_build_object('average', coalesce(round(avg(o.total), 2), 0), 'orders', count(*))
  from public.orders o
  where o.customer_id = customer_id_input
    and o.status <> 'canceled';
$$;
