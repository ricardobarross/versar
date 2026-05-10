'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Sparkles, Loader2, User, Package } from 'lucide-react'

interface SecretariaSheetProps {
  tipo: 'cliente' | 'produto'
  id: string
  nome: string
  aberto: boolean
  onFechar: () => void
}

interface DadosCliente {
  totalPedidos: number
  totalGasto: number
  ultimoPedido: string | null
  diasSemComprar: number | null
  produtosHabituais: { nome: string; quantidade: number }[]
  pagamentosPendentes: number
  resumoIA: string
}

interface DadosProduto {
  totalVendido: number
  receitaTotal: number
  estoqueTotal: number
  precoMedio: number
  margemSugerida: number
  produtosSimilares: { nome: string; preco: number }[]
  analiseIA: string
}

export default function SecretariaSheet({ tipo, id, nome, aberto, onFechar }: SecretariaSheetProps) {
  const [dados, setDados] = useState<DadosCliente | DadosProduto | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const overlay = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    setDados(null)
    setErro(null)
    setCarregando(true)

    fetch(`/api/secretaria/${tipo}/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.erro) throw new Error(d.erro)
        setDados(d)
      })
      .catch(e => setErro(e.message ?? 'Erro ao carregar'))
      .finally(() => setCarregando(false))
  }, [aberto, tipo, id])

  // Fechar ao clicar fora
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlay.current) onFechar()
  }

  // Fechar com Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    if (aberto) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [aberto, onFechar])

  function formatBRL(v: number) {
    return `R$ ${v.toFixed(2).replace('.', ',')}`
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlay}
        onClick={handleOverlayClick}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          aberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-3xl shadow-2xl transition-transform duration-400 ease-out ${
          aberto ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Secretária</p>
              <p className="text-zinc-400 text-xs truncate max-w-[200px]">{nome}</p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(85vh - 90px)' }}>

          {/* Loading */}
          {carregando && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
              <p className="text-zinc-400 text-sm">A analisar dados...</p>
            </div>
          )}

          {/* Erro */}
          {erro && !carregando && (
            <div className="bg-red-950 border border-red-800 rounded-2xl p-4 text-red-400 text-sm">
              {erro}
            </div>
          )}

          {/* Dados Cliente */}
          {!carregando && !erro && dados && tipo === 'cliente' && (() => {
            const d = dados as DadosCliente
            return (
              <div className="flex flex-col gap-4">

                {/* Resumo IA */}
                <div className="bg-gradient-to-br from-violet-950/60 to-indigo-950/60 border border-violet-800/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <p className="text-violet-300 text-xs font-semibold uppercase tracking-wide">Análise IA</p>
                  </div>
                  <p className="text-zinc-200 text-sm leading-relaxed">{d.resumoIA}</p>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                    <p className="text-zinc-500 text-xs mb-1">Total de pedidos</p>
                    <p className="text-white text-2xl font-bold">{d.totalPedidos}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                    <p className="text-zinc-500 text-xs mb-1">Total gasto</p>
                    <p className="text-white text-lg font-bold">{formatBRL(d.totalGasto)}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                    <p className="text-zinc-500 text-xs mb-1">Último pedido</p>
                    <p className={`text-sm font-semibold ${
                      d.diasSemComprar !== null && d.diasSemComprar > 60
                        ? 'text-red-400'
                        : d.diasSemComprar !== null && d.diasSemComprar > 30
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}>
                      {d.diasSemComprar === null
                        ? 'Nunca comprou'
                        : d.diasSemComprar === 0
                        ? 'Hoje'
                        : `Há ${d.diasSemComprar} dias`}
                    </p>
                    {d.ultimoPedido && (
                      <p className="text-zinc-500 text-xs mt-0.5">{d.ultimoPedido}</p>
                    )}
                  </div>
                  <div className={`border rounded-2xl p-3.5 ${
                    d.pagamentosPendentes > 0
                      ? 'bg-red-950/40 border-red-800/50'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}>
                    <p className="text-zinc-500 text-xs mb-1">Pagamentos pendentes</p>
                    <p className={`text-2xl font-bold ${d.pagamentosPendentes > 0 ? 'text-red-400' : 'text-white'}`}>
                      {d.pagamentosPendentes}
                    </p>
                  </div>
                </div>

                {/* Produtos habituais */}
                {d.produtosHabituais.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Produtos que costuma comprar
                    </p>
                    <div className="flex flex-col gap-2">
                      {d.produtosHabituais.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <p className="text-zinc-200 text-sm truncate flex-1">{p.nome}</p>
                          <span className="text-zinc-500 text-xs ml-2 flex-shrink-0">{p.quantidade}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {d.produtosHabituais.length === 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <p className="text-zinc-500 text-sm">Nenhum pedido registado ainda</p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Dados Produto */}
          {!carregando && !erro && dados && tipo === 'produto' && (() => {
            const d = dados as DadosProduto
            return (
              <div className="flex flex-col gap-4">

                {/* Análise IA */}
                <div className="bg-gradient-to-br from-violet-950/60 to-indigo-950/60 border border-violet-800/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <p className="text-violet-300 text-xs font-semibold uppercase tracking-wide">Análise IA</p>
                  </div>
                  <p className="text-zinc-200 text-sm leading-relaxed">{d.analiseIA}</p>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                    <p className="text-zinc-500 text-xs mb-1">Unidades vendidas</p>
                    <p className="text-white text-2xl font-bold">{d.totalVendido}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                    <p className="text-zinc-500 text-xs mb-1">Receita total</p>
                    <p className="text-white text-lg font-bold">{formatBRL(d.receitaTotal)}</p>
                  </div>
                  <div className={`border rounded-2xl p-3.5 ${
                    d.estoqueTotal === 0
                      ? 'bg-red-950/40 border-red-800/50'
                      : d.estoqueTotal < 5
                      ? 'bg-yellow-950/40 border-yellow-800/50'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}>
                    <p className="text-zinc-500 text-xs mb-1">Estoque total</p>
                    <p className={`text-2xl font-bold ${
                      d.estoqueTotal === 0 ? 'text-red-400' :
                      d.estoqueTotal < 5 ? 'text-yellow-400' : 'text-white'
                    }`}>{d.estoqueTotal}</p>
                    {d.estoqueTotal === 0 && <p className="text-red-400 text-xs mt-0.5">Sem estoque</p>}
                    {d.estoqueTotal > 0 && d.estoqueTotal < 5 && <p className="text-yellow-400 text-xs mt-0.5">Estoque baixo</p>}
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                    <p className="text-zinc-500 text-xs mb-1">Preço médio de venda</p>
                    <p className="text-white text-lg font-bold">{formatBRL(d.precoMedio)}</p>
                  </div>
                </div>

                {/* Produtos similares */}
                {d.produtosSimilares.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-3">
                      Produtos similares na loja
                    </p>
                    <div className="flex flex-col gap-2">
                      {d.produtosSimilares.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <p className="text-zinc-200 text-sm truncate flex-1">{p.nome}</p>
                          <span className="text-zinc-400 text-sm ml-2 flex-shrink-0">{formatBRL(p.preco)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}