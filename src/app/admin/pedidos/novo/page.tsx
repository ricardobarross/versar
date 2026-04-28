import { createClient } from '@/lib/supabase/server'
import PedidoForm from '@/components/admin/PedidoForm'

export default async function NovoPedidoPage() {
  const supabase = createClient()

  const { data: clientes } = await supabase.from('clientes').select('*').order('nome')
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*, produto_variacoes(*)')
    .eq('ativo', true)
    .order('nome')

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Novo Pedido</h1>
      <PedidoForm clientes={clientes ?? []} produtos={produtos ?? []} />
    </div>
  )
}