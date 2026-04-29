import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PaginaProduto from '@/components/loja/PaginaProduto'

export const dynamic = 'force-dynamic'

// No Next.js 15, params é uma Promise
interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const supabase = createClient()

  const { data: produto, error } = await supabase
    .from('produtos')
    .select(`
      *,
      categorias (id, nome, slug),
      produto_fotos (id, url, principal),
      produto_variacoes (id, cor, tamanho, estoque)
    `)
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (error || !produto) {
    console.error('Erro ao buscar produto:', error)
    notFound()
  }

  // Ajusta 'estoque' do banco para 'stock' do componente
  const produtoFormatado = {
    ...produto,
    produto_variacoes: produto.produto_variacoes?.map((v: any) => ({
      ...v,
      stock: v.estoque
    }))
  }

  return <PaginaProduto produto={produtoFormatado} />
}