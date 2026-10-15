import { createClient } from '@/lib/supabase/server'
import OrderForm from '@/components/admin/PedidoForm'

export default async function NewOrderPage() {
  const supabase = createClient()

  const { data: customers } = await supabase.from('customers').select('*').order('name')
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Novo pedido</h1>
      <OrderForm customers={customers ?? []} products={products ?? []} />
    </div>
  )
}