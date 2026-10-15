import { createClient } from '@/lib/supabase/server'
import ClienteForm from '@/components/admin/ClienteForm'
import { notFound } from 'next/navigation'

export default async function EditCustomerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const { data: customer } = await supabase.from('customers').select('*').eq('id', params.id).single()
  if (!customer) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Editar cliente</h1>
      <ClienteForm cliente={customer} />
    </div>
  )
}