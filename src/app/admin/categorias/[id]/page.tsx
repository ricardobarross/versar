import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CategoriaForm from '@/components/admin/CategoriaForm'

export default async function EditarCategoriaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const { data: categoria } = await supabase
    .from('categories')
    .select('id, name, description, is_active')
    .eq('id', params.id)
    .maybeSingle()

  if (!categoria) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Editar categoria</h1>
      <CategoriaForm categoria={categoria} />
    </div>
  )
}
