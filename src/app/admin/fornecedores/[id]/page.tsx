import { createClient } from '@/lib/supabase/server'
import FornecedorForm from '@/components/admin/FornecedorForm'
import { notFound } from 'next/navigation'

export default async function EditarFornecedorPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: fornecedor } = await supabase.from('fornecedores').select('*').eq('id', params.id).single()
  if (!fornecedor) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Editar Fornecedor</h1>
      <FornecedorForm fornecedor={fornecedor} />
    </div>
  )
}