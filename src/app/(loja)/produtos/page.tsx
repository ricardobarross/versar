import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { Database } from '@/types'

export const metadata: Metadata = {
  title: 'Produtos',
}

async function getProdutos() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data } = await supabase
    .from('produtos')
    .select(`
      id, nome, slug, preco, preco_promocional, destaque,
      produto_fotos (url, principal),
      categorias (id, nome, slug)
    `)
    .eq('ativo', true)
    .order('created_at', { ascending: false })
  return data ?? []
}

async function getCategorias() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data } = await supabase.from('categorias').select('id, nome, slug').eq('ativo', true).order('nome')
  return data ?? []
}

export default async function ProdutosPage() {
  const [produtos, categorias] = await Promise.all([getProdutos(), getCategorias()])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Produtos</h1>
        <p className="text-zinc-500 mt-1">{produtos.length} produto{produtos.length !== 1 ? 's' : ''}</p>
      </div>

      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-zinc-200">
          <Link href="/produtos" className="px-4 py-2 text-sm font-medium border border-zinc-900 bg-zinc-900 text-white">
            Todos
          </Link>
          {categorias.map((cat) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className="px-4 py-2 text-sm font-medium border border-zinc-300 text-zinc-600 hover:border-zinc-900 transition-colors"
            >
              {cat.nome}
            </Link>
          ))}
        </div>
      )}

      {produtos.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-xl font-medium mb-2">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {produtos.map((produto) => {
            const fotos = produto.produto_fotos as any[]
            const foto = fotos?.find((f: any) => f.principal)?.url ?? fotos?.[0]?.url ?? null
            const temPromocao = produto.preco_promocional && produto.preco_promocional < produto.preco

            return (
              <Link key={produto.id} href={`/produtos/${produto.slug}`} className="group">
                <div className="aspect-[3/4] bg-zinc-100 overflow-hidden mb-4 relative">
                  {foto ? (
                    <Image
                      src={foto}
                      alt={produto.nome}
                      width={400}
                      height={533}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {temPromocao && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5">PROMO</div>
                  )}
                </div>
                <h3 className="font-medium text-zinc-900 text-sm line-clamp-2">{produto.nome}</h3>
                <div className="mt-1.5 flex items-center gap-2">
                  {temPromocao ? (
                    <>
                      <span className="font-bold text-red-600 text-sm">
                        {Number(produto.preco_promocional).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                      </span>
                      <span className="text-xs text-zinc-400 line-through">
                        {Number(produto.preco).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-zinc-900 text-sm">
                      {Number(produto.preco).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
