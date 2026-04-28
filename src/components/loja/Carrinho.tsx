'use client'

import { useState, createContext, useContext } from 'react'
import type { Produto, ProdutoVariacao } from '@/types'

type ItemCarrinho = {
  produto: Produto
  variacao?: ProdutoVariacao
  quantidade: number
}

type CarrinhoContextType = {
  itens: ItemCarrinho[]
  adicionar: (produto: Produto, variacao?: ProdutoVariacao) => void
  remover: (index: number) => void
  limpar: () => void
  total: number
  quantidade: number
}

const CarrinhoContext = createContext<CarrinhoContextType | null>(null)

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([])

  function adicionar(produto: Produto, variacao?: ProdutoVariacao) {
    setItens(prev => {
      const existente = prev.findIndex(
        i => i.produto.id === produto.id && i.variacao?.id === variacao?.id
      )
      if (existente >= 0) {
        return prev.map((item, i) =>
          i === existente ? { ...item, quantidade: item.quantidade + 1 } : item
        )
      }
      return [...prev, { produto, variacao, quantidade: 1 }]
    })
  }

  function remover(index: number) {
    setItens(prev => prev.filter((_, i) => i !== index))
  }

  function limpar() { setItens([]) }

  const total = itens.reduce((acc, item) => {
    const preco = item.produto.preco_promocional ?? item.produto.preco
    return acc + preco * item.quantidade
  }, 0)

  const quantidade = itens.reduce((acc, item) => acc + item.quantidade, 0)

  return (
    <CarrinhoContext.Provider value={{ itens, adicionar, remover, limpar, total, quantidade }}>
      {children}
    </CarrinhoContext.Provider>
  )
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext)
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider')
  return ctx
}