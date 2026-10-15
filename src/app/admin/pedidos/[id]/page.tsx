import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PedidoForm, { type PedidoExistente } from '@/components/admin/PedidoForm'
import { orderStatusMeta } from '@/lib/orders'
import { formatarDataHora } from '@/lib/datas'

export const metadata = { title: 'Pedido' }

const ORIGENS: Record<string, string> = { loja_online: 'Loja online', painel: 'Painel', whatsapp: 'WhatsApp' }

export default async function EditarPedidoPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const [{ data: order }, { data: customers }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, numero, customer_id, status, payment_method, notes, origin, stock_reserved, total, created_at, order_items(product_id, variation_id, quantity, unit_price, price, products(name), product_variations(color, size))')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('customers').select('id, name, whatsapp').order('name'),
  ])

  if (!order) notFound()

  const status = orderStatusMeta(order.status)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-white">Pedido #{order.numero}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${status.badge}`}>{status.label}</span>
        <span className="text-zinc-500 text-sm">
          {ORIGENS[order.origin] ?? order.origin} · {formatarDataHora(order.created_at)}
        </span>
      </div>
      <PedidoForm order={order as unknown as PedidoExistente} customers={customers ?? []} products={[]} />
    </div>
  )
}
