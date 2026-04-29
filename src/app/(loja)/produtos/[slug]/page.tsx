import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PaginaProduto from '@/components/loja/PaginaProduto'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function Page({ params }: PageProps) {
  const supabase = createClient()

  // O SEGREDO ESTÁ AQUI: 
  // Precisamos incluir 'produto_fotos(*)' na seleção para que o array de fotos não venha vazio.
  const { data: produto, error } = await supabase
    .from('produtos')
    .select(`
      *,
      categorias (
        id,
        nome,
        slug
      ),
      produto_fotos (
        id,
        url,
        principal
      ),
      produto_variacoes (
        id,
        cor,
        tamanho,
        stock
      )
    `)
    .eq('slug', params.slug)
    .eq('ativo', true)
    .single()

  if (error || !produto) {
    console.error('Erro ao buscar produto:', error)
    notFound()
  }

  return <PaginaProduto produto={produto} />
}