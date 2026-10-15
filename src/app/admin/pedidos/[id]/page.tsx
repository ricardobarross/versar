import { createClient } from '@/lib/supabase/server'
import OrderForm from '@/components/admin/PedidoForm'
import { notFound } from 'next/navigation'

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, customers(*), order_items(*, products(*))')
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  const { data: customers } = await supabase.from('customers').select('*').order('name')
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">
        Order #{order.id.slice(0, 8).toUpperCase()}
      </h1>
      <OrderForm order={order} customers={customers ?? []} products={products ?? []} />
    </div>
  )
}