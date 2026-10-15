import { createClient } from '@/lib/supabase/server'
import ClientesClient from './ClientesClient'

export default async function ClientesPage() {
  const supabase = createClient()

  const { data: clientes } = await supabase
    .from('customers')
    .select('id, name, whatsapp, email, city, state')
    .order('name')

  return <ClientesClient clientes={clientes ?? []} />
}