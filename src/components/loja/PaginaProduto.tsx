'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { useCarrinho } from '@/components/loja/CarrinhoContext'

interface Foto {
  id: string
  url: string
  principal: boolean
}

interface Variacao {
  id: string
  cor: string | null
  tamanho: string | null
  stock: number
}

interface Produto {
  id: string
  nome: string
  slug: string
  descricao: string | null
  preco: number
  preco_promocional: number | null
  ativo: boolean
  destaque: boolean
  produto_fotos: Foto[]
  produto_variacoes: Variacao[]
  categorias?: { id: string; nome: string; slug: string } | null
}

interface PaginaProdutoProps {
  produto: Produto
}

export default function PaginaProduto({ produto }: PaginaProdutoProps) {
  const fotos = produto.produto_fotos ?? []
  const variacoes = produto.produto_variacoes ?? []

  const fotosOrdenadas = [...fotos].sort((a, b) => (b.principal ? 1 : 0) - (a.principal ? 1 : 0))

  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [corSelecionada, setCorSelecionada] = useState<string | null>(null)
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<string | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [adicionado, setAdicionado] = useState(false)

  const { adicionarItem } = useCarrinho()

  const temPromocao = produto.preco_promocional && produto.preco_promocional < produto.preco
  const desconto = temPromocao
    ? Math.round(((produto.preco - produto.preco_promocional!) / produto.preco) * 100)
    : 0

  const cores = [...new Set(variacoes.filter((v) => v.cor).map((v) => v.cor!))]
  const tamanhos = [...new Set(variacoes.filter((v) => v.tamanho).map((v) => v.tamanho!))]

  const variacaoAtual = variacoes.find(
    (v) =>
      (cores.length === 0 || v.cor === corSelecionada) &&
      (tamanhos.length === 0 || v.tamanho === tamanhoSelecionado)
  )
  const stockDisponivel = variacaoAtual?.stock ?? (variacoes.length === 0 ? 99 : 0)

  function handleAdicionarCarrinho() {
    if (cores.length > 0 && !corSelecionada) {
      alert('Por favor, selecione uma cor.')
      return
    }
    if (tamanhos.length > 0 && !tamanhoSelecionado) {
      alert('Por favor, selecione um tamanho.')
      return
    }
    if (stockDisponivel < quantidade) {
      alert('Stock insuficiente.')
      return
    }

    const variacaoId = variacaoAtual?.id ?? variacoes[0]?.id ?? produto.id
    const variacaoNome = [corSelecionada, tamanhoSelecionado].filter(Boolean).join(' / ') || 'Único'

    for (let i = 0; i < quantidade; i++) {
      adicionarItem({
        variacaoId,
        produtoId: produto.id,
        produtoSlug: produto.slug,
        produtoNome: produto.nome,
        variacaoNome,
        preco: temPromocao ? produto.preco_promocional! : produto.preco,
        foto: fotosOrdenadas[0]?.url,
        estoqueMax: stockDisponivel,
      })
    }

    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2500)
  }

  function navegarFoto(dir: 'prev' | 'next') {
    setFotoAtiva((prev) => {
      if (dir === 'prev') return prev === 0 ? fotosOrdenadas.length - 1 : prev - 1
      return prev === fotosOrdenadas.length - 1 ? 0 : prev + 1
    })
  }

  const fotoAtual = fotosOrdenadas[fotoAtiva]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-1">
          <Link href="/" className="hover:text-zinc-900 transition-colors shrink-0">Início</Link>
          <span>/</span>
          <Link href="/produtos" className="hover:text-zinc-900 transition-colors shrink-0">Produtos</Link>
          {produto.categorias && (
            <>
              <span>/</span>
              <Link
                href={`/categoria/${produto.categorias.slug}`}
                className="hover:text-zinc-900 transition-colors shrink-0"
              >
                {produto.categorias.nome}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-zinc-900 font-medium truncate max-w-[160px] sm:max-w-[200px]">{produto.nome}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">

          {/* Galeria de Fotos */}
          <div className="space-y-3">

            {/* Foto Principal */}
            <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden group">
              {fotoAtual ? (
                <Image
                  src={fotoAtual.url}
                  alt={produto.nome}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Navegação fotos — sempre visível em touch, hover no desktop */}
              {fotosOrdenadas.length > 1 && (
                <>
                  <button
                    onClick={() => navegarFoto('prev')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow transition-opacity opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navegarFoto('next')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow transition-opacity opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Indicador de foto em mobile */}
              {fotosOrdenadas.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
                  {fotosOrdenadas.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFotoAtiva(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        idx === fotoAtiva ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`Foto ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Badge promoção */}
              {temPromocao && (
                <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1">
                  -{desconto}%
                </div>
              )}
            </div>

            {/* Miniaturas — scroll horizontal mobile, grid no desktop */}
            {fotosOrdenadas.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible scrollbar-hide">
                {fotosOrdenadas.map((foto, idx) => (
                  <button
                    key={foto.id}
                    onClick={() => setFotoAtiva(idx)}
                    className={`flex-shrink-0 w-16 h-16 md:w-auto md:h-auto md:aspect-square overflow-hidden border-2 transition-colors ${
                      idx === fotoAtiva ? 'border-zinc-900' : 'border-transparent hover:border-zinc-300'
                    }`}
                  >
                    <Image
                      src={foto.url}
                      alt={`${produto.nome} ${idx + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="lg:sticky lg:top-8 lg:self-start space-y-6 sm:space-y-8">

            {/* Nome e Preço */}
            <div>
              {produto.categorias && (
                <Link
                  href={`/categoria/${produto.categorias.slug}`}
                  className="text-xs font-semibold tracking-widest text-zinc-400 uppercase hover:text-zinc-600 transition-colors"
                >
                  {produto.categorias.nome}
                </Link>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-2 mb-4">{produto.nome}</h1>

              <div className="flex items-baseline gap-3 flex-wrap">
                {temPromocao ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-bold text-red-600">
                      {Number(produto.preco_promocional).toLocaleString('pt-PT', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </span>
                    <span className="text-lg sm:text-xl text-zinc-400 line-through">
                      {Number(produto.preco).toLocaleString('pt-PT', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </span>
                    <span className="text-sm bg-red-100 text-red-600 px-2 py-0.5 font-semibold">
                      Poupa {desconto}%
                    </span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-900">
                    {Number(produto.preco).toLocaleString('pt-PT', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </span>
                )}
              </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Seleção de Cor */}
            {cores.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-zinc-700 mb-3">
                  Cor:{' '}
                  {corSelecionada && <span className="font-normal text-zinc-500">{corSelecionada}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cores.map((cor) => (
                    <button
                      key={cor}
                      onClick={() => setCorSelecionada(cor)}
                      className={`px-4 py-2.5 min-h-[44px] border text-sm font-medium transition-colors ${
                        corSelecionada === cor
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 text-zinc-700 hover:border-zinc-900'
                      }`}
                    >
                      {cor}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seleção de Tamanho */}
            {tamanhos.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-zinc-700 mb-3">
                  Tamanho:{' '}
                  {tamanhoSelecionado && <span className="font-normal text-zinc-500">{tamanhoSelecionado}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tamanhos.map((tam) => {
                    const stockTam = variacoes.find(
                      (v) => v.tamanho === tam && (!corSelecionada || v.cor === corSelecionada)
                    )?.stock ?? 0
                    const semStock = stockTam === 0

                    return (
                      <button
                        key={tam}
                        onClick={() => !semStock && setTamanhoSelecionado(tam)}
                        disabled={semStock}
                        className={`w-12 h-12 border text-sm font-medium transition-colors relative ${
                          tamanhoSelecionado === tam
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : semStock
                            ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                            : 'border-zinc-300 text-zinc-700 hover:border-zinc-900'
                        }`}
                      >
                        {tam}
                        {semStock && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="absolute w-full h-px bg-zinc-300 rotate-45" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantidade */}
            <div>
              <p className="text-sm font-semibold text-zinc-700 mb-3">Quantidade</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-zinc-300">
                  <button
                    onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors text-lg"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-semibold text-zinc-900">{quantidade}</span>
                  <button
                    onClick={() => setQuantidade((q) => Math.min(stockDisponivel, q + 1))}
                    className="w-11 h-11 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
                {variacoes.length > 0 && (
                  <span className="text-sm text-zinc-500">
                    {stockDisponivel > 0 ? `${stockDisponivel} disponíveis` : 'Sem stock'}
                  </span>
                )}
              </div>
            </div>

            {/* Botão Adicionar ao Carrinho */}
            <div className="flex gap-3">
              <button
                onClick={handleAdicionarCarrinho}
                disabled={stockDisponivel === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm tracking-wide transition-all min-h-[52px] ${
                  stockDisponivel === 0
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : adicionado
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-[0.98]'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {adicionado ? 'Adicionado! ✓' : stockDisponivel === 0 ? 'Sem Stock' : 'Adicionar ao Carrinho'}
              </button>
              <button
                className="w-14 h-14 flex items-center justify-center border border-zinc-300 hover:border-zinc-900 transition-colors active:scale-[0.97]"
                aria-label="Adicionar aos favoritos"
              >
                <Heart className="w-5 h-5 text-zinc-600" />
              </button>
            </div>

            {/* Descrição */}
            {produto.descricao && (
              <div>
                <hr className="border-zinc-100 mb-6" />
                <h2 className="text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-wider">
                  Descrição
                </h2>
                <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                  {produto.descricao}
                </div>
              </div>
            )}

            {/* Info adicional */}
            <div className="border border-zinc-100 p-4 space-y-3">
              {[
                { icon: '🚚', texto: 'Envio para todo Portugal' },
                { icon: '↩️', texto: 'Trocas e devoluções em 30 dias' },
                { icon: '🔒', texto: 'Pagamento seguro' },
              ].map(({ icon, texto }) => (
                <div key={texto} className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="text-base">{icon}</span>
                  <span>{texto}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}