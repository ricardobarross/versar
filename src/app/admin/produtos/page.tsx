import { createClient } from '@/lib/supabase/server'
import ProdutosClient from './ProdutosClient'

export default async function ProdutosPage() {
  const supabase = createClient()

  const { data: produtos } = await supabase
    .from('produtos')
    .select(`
      *,
      produto_fotos (url, ordem),
      produto_variacoes (estoque),
      categorias (nome)
    `)
    .order('created_at', { ascending: false })

  return <ProdutosClient produtos={produtos ?? []} />
}