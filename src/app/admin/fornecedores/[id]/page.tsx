import { createClient } from '@/lib/supabase/server'
import FornecedorForm from '@/components/admin/FornecedorForm'
import { notFound } from 'next/navigation'

export default async function EditSupplierPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: supplier } = await supabase.from('suppliers').select('*').eq('id', params.id).single()
  if (!supplier) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Editar fornecedor</h1>
      <FornecedorForm supplier={supplier} />
    </div>
  )
}