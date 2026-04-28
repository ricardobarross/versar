import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PaginaProduto from '@/components/loja/PaginaProduto'

export default async function ProdutoPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: produto } = await supabase
    .from('produtos')
    .select('*, produto_fotos(*), produto_variacoes(*), categorias(nome)')
    .eq('slug', params.slug)
    .eq('ativo', true)
    .single()

  if (!produto) notFound()

  const { data: config } = await supabase.from('configuracoes_loja').select('whatsapp, nome_loja').single()

  return <PaginaProduto produto={produto} whatsapp={config?.whatsapp ?? ''} />
}