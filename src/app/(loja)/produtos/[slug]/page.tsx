import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PaginaProduto from '@/components/loja/PaginaProduto'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: PageProps) {
  // 1. Aguarda os parâmetros (Obrigatório no Next.js 15)
  const { slug } = await params
  const supabase = createClient()

  // 2. Busca o produto (Garante que os nomes das tabelas batem com o seu print)
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

  // 3. Se houver erro ou não achar o slug exato, dá 404
  if (error || !produto) {
    console.error('Erro Supabase:', error?.message)
    notFound()
  }

  // 4. Formata os dados: transforma 'estoque' do banco em 'stock' para o componente
  const produtoFormatado = {
    ...produto,
    produto_variacoes: produto.produto_variacoes?.map((v: any) => ({
      ...v,
      stock: v.estoque // Converte o nome da coluna para não dar erro na tela
    }))
  }

  return <PaginaProduto produto={produtoFormatado} />
}