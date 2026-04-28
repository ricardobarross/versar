'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, MessageCircle } from 'lucide-react'
import type { Produto, ProdutoVariacao } from '@/types'

type Props = {
  produto: Produto & {
    produto_fotos?: any[]
    produto_variacoes?: ProdutoVariacao[]
    categorias?: any
  }
  whatsapp: string
}

export default function PaginaProduto({ produto, whatsapp }: Props) {
  const fotos = produto.produto_fotos?.sort((a, b) => a.ordem - b.ordem) ?? []
  const variacoes = produto.produto_variacoes ?? []

  const cores = [...new Set(variacoes.map(v => v.cor).filter(Boolean))]
  const tamanhos = [...new Set(variacoes.map(v => v.tamanho).filter(Boolean))]

  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [corSelecionada, setCorSelecionada] = useState('')
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('')

  const variacaoSelecionada = variacoes.find(
    v => v.cor === corSelecionada && v.tamanho === tamanhoSelecionado
  )

  const estoque = variacaoSelecionada?.estoque ?? 0
  const temStock = variacaoSelecionada ? estoque > 0 : variacoes.some(v => v.estoque > 0)
  const preco = produto.preco_promocional ?? produto.preco
  const temPromocao = produto.preco_promocional && produto.preco_promocional < produto.preco

  function gerarMensagemWhatsApp() {
    const variacaoTexto = [corSelecionada, tamanhoSelecionado].filter(Boolean).join(' / ')
    const msg = `Olá! Tenho interesse no produto:\n\n*${produto.nome}*${variacaoTexto ? `\nVariação: ${variacaoTexto}` : ''}\nPreço: R$ ${preco.toFixed(2).replace('.', ',')}\n\nPoderia me dar mais informações?`
    return `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 text-sm mb-8 transition-colors">
        <ChevronLeft size={16} /> Voltar à loja
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Fotos */}
        <div>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 mb-4">
            {fotos.length > 0 ? (
              <img src={fotos[fotoAtiva]?.url} alt={produto.nome}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">Sem foto</div>
            )}
          </div>
          {fotos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {fotos.map((foto, i) => (
                <button key={i} onClick={() => setFotoAtiva(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${i === fotoAtiva ? 'border-zinc-950' : 'border-transparent'}`}>
                  <img src={foto.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes */}
        <div>
          {produto.categorias?.nome && (
            <p className="text-zinc-500 text-sm mb-2">{produto.categorias.nome}</p>
          )}
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">{produto.nome}</h1>

          <div className="flex items-center gap-3 mb-6">
            {temPromocao && (
              <span className="text-zinc-400 text-lg line-through">
                R$ {produto.preco.toFixed(2).replace('.', ',')}
              </span>
            )}
            <span className={`text-3xl font-bold ${temPromocao ? 'text-red-500' : 'text-zinc-900'}`}>
              R$ {preco.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {produto.descricao && (
            <p className="text-zinc-600 mb-6 leading-relaxed">{produto.descricao}</p>
          )}

          {/* Cores */}
          {cores.length > 0 && (
            <div className="mb-4">
              <p className="text-zinc-700 text-sm font-semibold mb-2">Cor</p>
              <div className="flex gap-2 flex-wrap">
                {cores.map(cor => (
                  <button key={cor} onClick={() => setCorSelecionada(cor ?? '')}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${corSelecionada === cor ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200 text-zinc-700 hover:border-zinc-950'}`}>
                    {cor}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tamanhos */}
          {tamanhos.length > 0 && (
            <div className="mb-6">
              <p className="text-zinc-700 text-sm font-semibold mb-2">Tamanho</p>
              <div className="flex gap-2 flex-wrap">
                {tamanhos.map(tam => (
                  <button key={tam} onClick={() => setTamanhoSelecionado(tam ?? '')}
                    className={`w-12 h-12 rounded-lg border text-sm font-semibold transition-colors ${tamanhoSelecionado === tam ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200 text-zinc-700 hover:border-zinc-950'}`}>
                    {tam}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estoque */}
          {variacaoSelecionada && (
            <p className={`text-sm mb-4 ${estoque > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {estoque > 0 ? `${estoque} em estoque` : 'Sem estoque para esta variação'}
            </p>
          )}

          {/* Botão WhatsApp */}
          <a href={gerarMensagemWhatsApp()} target="_blank"
            className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-lg transition-colors ${temStock ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed pointer-events-none'}`}>
            <MessageCircle size={24} />
            {temStock ? 'Comprar pelo WhatsApp' : 'Produto esgotado'}
          </a>

          <p className="text-zinc-400 text-xs text-center mt-3">
            Você será redirecionado para o WhatsApp para finalizar o pedido
          </p>
        </div>
      </div>
    </div>
  )
}