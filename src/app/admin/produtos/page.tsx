import { createClient } from '@/lib/supabase/server'
import ProdutosClient from './ProdutosClient'

export default async function ProdutosPage() {
  const supabase = createClient()

  const { data: produtos } = await supabase
    .from('products')
    .select(`
      *,
      product_images (url, ordem),
      product_variations (stock),
      categories (name)
    `)
    .order('created_at', { ascending: false })

  return <ProdutosClient produtos={produtos ?? []} />
}