import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PaginaProduto from '@/components/loja/PaginaProduto'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: PageProps) {
  // 1. Aguarda o slug (obrigatório no Next.js 15)
  const { slug } = await params
  const supabase = createClient()

  // 2. Consulta usando os nomes exatos das suas colunas
  const { data: produto, error } = await supabase
    .from('produtos')
    .select(`
      *,
      categorias (id, nome, slug),
      produto_fotos (id, url, ordem),
      produto_variacoes (id, cor, tamanho, estoque)
    `)
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  // 3. Tratamento de erro/404
  if (error || !produto) {
    console.error('Erro na busca:', error?.message)
    notFound()
  }

  // 4. Tradução de dados para o componente visual
  const produtoFormatado = {
    ...produto,
    // Converte 'estoque' para 'stock' e garante que as fotos seguem a 'ordem'
    produto_fotos: produto.produto_fotos?.sort((a: any, b: any) => a.ordem - b.ordem) || [],
    produto_variacoes: produto.produto_variacoes?.map((v: any) => ({
      ...v,
      stock: v.estoque 
    })) || []
  }

  return <PaginaProduto produto={produtoFormatado} />
}