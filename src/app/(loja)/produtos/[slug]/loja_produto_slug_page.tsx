import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PaginaProduto from '@/components/loja/PaginaProduto'
import type { Database } from '@/types'

interface PageProps {
  params: { slug: string }
}

async function getProduto(slug: string) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data } = await supabase
    .from('produtos')
    .select(`
      id, nome, slug, descricao, preco, preco_promocional, ativo, destaque,
      produto_fotos (id, url, principal),
      produto_variacoes (id, cor, tamanho, stock),
      categorias (id, nome, slug)
    `)
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  return data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const produto = await getProduto(params.slug)
  if (!produto) return { title: 'Produto não encontrado' }

  return {
    title: produto.nome,
    description: produto.descricao ?? `Comprar ${produto.nome}`,
  }
}

export default async function ProdutoPage({ params }: PageProps) {
  const produto = await getProduto(params.slug)

  if (!produto) {
    notFound()
  }

  // Garantir que os arrays existem (Supabase pode devolver null em joins)
  const produtoFormatado = {
    ...produto,
    produto_fotos: (produto.produto_fotos as any[]) ?? [],
    produto_variacoes: (produto.produto_variacoes as any[]) ?? [],
    categorias: produto.categorias as any ?? null,
  }

  return <PaginaProduto produto={produtoFormatado} />
}
