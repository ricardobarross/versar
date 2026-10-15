import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PaginaProduto from '@/components/loja/PaginaProduto'
import { PRODUTO_DETALHE_SELECT, normalizarProduto, type ProdutoLoja } from '@/lib/loja'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

async function buscarProduto(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUTO_DETALHE_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) console.error('[produto]', error.message)
  return data as unknown as ProdutoLoja | null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const produto = await buscarProduto((await params).slug)
  if (!produto) return { title: 'Produto não encontrado' }
  return {
    title: produto.nome,
    description: produto.descricao ?? undefined,
    openGraph: {
      title: produto.nome,
      description: produto.descricao ?? undefined,
      images: produto.produto_fotos?.[0]?.url ? [produto.produto_fotos[0].url] : undefined,
    },
  }
}

export default async function Page({ params }: PageProps) {
  const bruto = await buscarProduto((await params).slug)
  if (!bruto) notFound()

  const produto = normalizarProduto(bruto)
  const produtoFormatado = {
    ...produto,
    descricao: produto.descricao ?? null,
    ativo: produto.ativo ?? true,
    produto_fotos: [...(produto.produto_fotos ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map(f => ({ id: f.id ?? f.url, url: f.url, principal: !!f.principal })),
    produto_variacoes: (produto.produto_variacoes ?? []).map(v => ({
      id: v.id ?? '',
      cor: v.cor ?? null,
      tamanho: v.tamanho ?? null,
      stock: v.estoque,
    })),
  }

  return <PaginaProduto produto={produtoFormatado} />
}