import { createClient } from '@/lib/supabase/server'
import PedidoForm, { type ProdutoPedido } from '@/components/admin/PedidoForm'

export const metadata = { title: 'Novo pedido' }

export default async function NovoPedidoPage() {
  const supabase = await createClient()

  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase.from('customers').select('id, name, whatsapp').order('name'),
    supabase
      .from('products')
      .select('id, name, price, promo_price, product_variations(id, color, size, stock, price, is_active)')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Novo pedido</h1>
      <PedidoForm customers={customers ?? []} products={(products ?? []) as ProdutoPedido[]} />
    </div>
  )
}
