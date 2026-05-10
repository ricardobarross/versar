import { createClient } from '@/lib/supabase/server'
import ClientesClient from './ClientesClient'

export default async function ClientesPage() {
  const supabase = createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, whatsapp, email, cidade, estado')
    .order('nome')

  return <ClientesClient clientes={clientes ?? []} />
}