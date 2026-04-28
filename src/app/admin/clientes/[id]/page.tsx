import { createClient } from '@/lib/supabase/server'
import ClienteForm from '@/components/admin/ClienteForm'
import { notFound } from 'next/navigation'

export default async function EditarClientePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: cliente } = await supabase.from('clientes').select('*').eq('id', params.id).single()
  if (!cliente) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Editar Cliente</h1>
      <ClienteForm cliente={cliente} />
    </div>
  )
}