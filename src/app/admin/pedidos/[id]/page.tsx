import { createClient } from '@/lib/supabase/server'
import PedidoForm from '@/components/admin/PedidoForm'
import { notFound } from 'next/navigation'

export default async function EditarPedidoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('*, clientes(*), pedido_itens(*, produtos(*))')
    .eq('id', params.id)
    .single()

  if (!pedido) notFound()

  const { data: clientes } = await supabase.from('clientes').select('*').order('nome')
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*, produto_variacoes(*)')
    .eq('ativo', true)
    .order('nome')

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">
        Pedido #{pedido.numero}
      </h1>
      <PedidoForm pedido={pedido} clientes={clientes ?? []} produtos={produtos ?? []} />
    </div>
  )
}