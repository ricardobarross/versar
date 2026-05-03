'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ItemCarrinho = {
  variacaoId: string
  produtoId: string
  produtoSlug: string
  produtoNome: string
  variacaoNome: string
  preco: number
  foto?: string
  quantidade: number
  estoqueMax: number
}

type CarrinhoContextType = {
  itens: ItemCarrinho[]
  totalItens: number
  totalPreco: number
  adicionarItem: (item: Omit<ItemCarrinho, 'quantidade'>) => void
  removerItem: (variacaoId: string) => void
  alterarQuantidade: (variacaoId: string, quantidade: number) => void
  limparCarrinho: () => void
}

const CarrinhoContext = createContext<CarrinhoContextType | null>(null)

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [hidratado, setHidratado] = useState(false)

  // Carregar do localStorage após hidratação (evita mismatch SSR/CSR)
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('versar-carrinho')
      if (salvo) setItens(JSON.parse(salvo))
    } catch {}
    setHidratado(true)
  }, [])

  // Guardar no localStorage sempre que os itens mudarem
  useEffect(() => {
    if (!hidratado) return
    try {
      localStorage.setItem('versar-carrinho', JSON.stringify(itens))
    } catch {}
  }, [itens, hidratado])

  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0)
  const totalPreco = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0)

  function adicionarItem(novoItem: Omit<ItemCarrinho, 'quantidade'>) {
    setItens(prev => {
      const existe = prev.find(i => i.variacaoId === novoItem.variacaoId)
      if (existe) {
        return prev.map(i =>
          i.variacaoId === novoItem.variacaoId
            ? { ...i, quantidade: Math.min(i.quantidade + 1, i.estoqueMax) }
            : i
        )
      }
      return [...prev, { ...novoItem, quantidade: 1 }]
    })
  }

  function removerItem(variacaoId: string) {
    setItens(prev => prev.filter(i => i.variacaoId !== variacaoId))
  }

  function alterarQuantidade(variacaoId: string, quantidade: number) {
    if (quantidade < 1) {
      removerItem(variacaoId)
      return
    }
    setItens(prev =>
      prev.map(i =>
        i.variacaoId === variacaoId
          ? { ...i, quantidade: Math.min(quantidade, i.estoqueMax) }
          : i
      )
    )
  }

  function limparCarrinho() {
    setItens([])
  }

  return (
    <CarrinhoContext.Provider value={{
      itens,
      totalItens,
      totalPreco,
      adicionarItem,
      removerItem,
      alterarQuantidade,
      limparCarrinho,
    }}>
      {children}
    </CarrinhoContext.Provider>
  )
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext)
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider')
  return ctx
}