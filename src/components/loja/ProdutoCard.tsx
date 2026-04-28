'use client'

import Link from 'next/link'
import type { Produto } from '@/types'

export default function ProdutoCard({ produto }: { produto: Produto }) {
  const foto = produto.produto_fotos
    ?.sort((a, b) => a.ordem - b.ordem)[0]

  const estoqueTotal = produto.produto_variacoes
    ?.reduce((acc, v) => acc + v.estoque, 0) ?? 0

  const temPromocao = produto.preco_promocional && produto.preco_promocional < produto.preco

  return (
    <Link href={`/produtos/${produto.slug}`} className="group block">
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 mb-3 relative">
        {foto ? (
          <img
            src={foto.url}
            alt={produto.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
            Sem foto
          </div>
        )}

        {temPromocao && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            PROMO
          </span>
        )}

        {estoqueTotal === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">
              Esgotado
            </span>
          </div>
        )}

        {produto.destaque && estoqueTotal > 0 && (
          <span className="absolute top-3 right-3 bg-zinc-950 text-white text-xs font-bold px-2 py-1 rounded-full">
            DESTAQUE
          </span>
        )}
      </div>

      <h3 className="text-zinc-900 font-semibold text-sm group-hover:text-zinc-600 transition-colors">
        {produto.nome}
      </h3>

      <div className="flex items-center gap-2 mt-1">
        {temPromocao ? (
          <>
            <span className="text-zinc-400 text-sm line-through">
              R$ {produto.preco.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-red-500 font-bold">
              R$ {produto.preco_promocional!.toFixed(2).replace('.', ',')}
            </span>
          </>
        ) : (
          <span className="text-zinc-900 font-bold">
            R$ {produto.preco.toFixed(2).replace('.', ',')}
          </span>
        )}
      </div>
    </Link>
  )
}