/**
 * Status de pedido — fonte única da verdade.
 * A base de dados tem um CHECK com estes mesmos valores
 * (supabase/migrations/20261016000001_order_status.sql).
 */
export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'paid',
  'picking',
  'shipped',
  'delivered',
  'canceled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; badge: string }> = {
  new:       { label: 'Novo',       badge: 'bg-blue-900 text-blue-400' },
  confirmed: { label: 'Confirmado', badge: 'bg-yellow-900 text-yellow-400' },
  paid:      { label: 'Pago',       badge: 'bg-emerald-900 text-emerald-400' },
  picking:   { label: 'Separando',  badge: 'bg-orange-900 text-orange-400' },
  shipped:   { label: 'Enviado',    badge: 'bg-purple-900 text-purple-400' },
  delivered: { label: 'Entregue',   badge: 'bg-green-900 text-green-400' },
  canceled:  { label: 'Cancelado',  badge: 'bg-red-900 text-red-400' },
}

/** Pedidos que ainda aguardam ação da loja. */
export const OPEN_ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'paid', 'picking']

/** Pedidos que contam como venda (tudo menos cancelado). */
export const SALE_ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'paid', 'picking', 'shipped', 'delivered']

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value)
}

export function orderStatusMeta(status: string) {
  return isOrderStatus(status)
    ? ORDER_STATUS_META[status]
    : { label: status, badge: 'bg-zinc-700 text-zinc-300' }
}

export const formatBRL = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))
