'use client'

import { useCarrinho } from '@/components/loja/CarrinhoContext'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ShoppingBag } from 'lucide-react'

export default function CarrinhoPage() {
  const { itens, totalItens, totalPreco, removerItem, alterarQuantidade, limparCarrinho } = useCarrinho()

  if (itens.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShoppingBag className="w-16 h-16 text-zinc-300" />
        <p className="text-xl font-semibold text-zinc-700">O teu carrinho está vazio</p>
        <p className="text-zinc-400 text-sm">Adiciona produtos para continuares</p>
        <Link
          href="/produtos"
          className="mt-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-zinc-700 transition-colors"
        >
          Ver produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
          Carrinho
          <span className="text-zinc-400 text-base sm:text-lg font-normal ml-2">
            ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
          </span>
        </h1>
        <button
          onClick={limparCarrinho}
          className="text-xs sm:text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Limpar tudo
        </button>
      </div>

      {/* Lista de itens */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {itens.map(item => (
          <div
            key={item.variacaoId}
            className="flex gap-3 sm:gap-4 items-center border border-zinc-100 rounded-2xl p-3 sm:p-4 bg-white"
          >
            {/* Foto */}
            {item.foto && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100">
                <Image src={item.foto} alt={item.produtoNome} fill className="object-cover" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/produtos/${item.produtoSlug}`}
                className="font-semibold text-zinc-900 text-sm sm:text-base hover:text-zinc-600 transition-colors line-clamp-1"
              >
                {item.produtoNome}
              </Link>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{item.variacaoNome}</p>
              <p className="text-zinc-900 font-bold text-sm mt-1">
                {Number(item.preco * item.quantidade).toLocaleString('pt-PT', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </p>
            </div>

            {/* Quantidade */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => alterarQuantidade(item.variacaoId, item.quantidade - 1)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors text-lg"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantidade}</span>
              <button
                onClick={() => alterarQuantidade(item.variacaoId, item.quantidade + 1)}
                disabled={item.quantidade >= item.estoqueMax}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors text-lg disabled:opacity-30"
              >
                +
              </button>
            </div>

            {/* Remover */}
            <button
              onClick={() => removerItem(item.variacaoId)}
              className="p-2 text-zinc-300 hover:text-red-400 transition-colors flex-shrink-0"
              aria-label="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Resumo */}
      <div className="mt-6 sm:mt-8 border-t border-zinc-100 pt-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <Link
            href="/produtos"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Continuar a comprar
          </Link>
          <div className="sm:text-right">
            <p className="text-zinc-500 text-sm">Total</p>
            <p className="text-3xl font-bold text-zinc-900">
              {Number(totalPreco).toLocaleString('pt-PT', {
                style: 'currency',
                currency: 'EUR',
              })}
            </p>
            <button className="mt-3 w-full sm:w-auto bg-zinc-900 hover:bg-zinc-700 text-white font-semibold px-8 py-3 rounded-full transition-colors">
              Finalizar pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}