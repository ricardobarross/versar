'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCarrinho } from '@/components/loja/CarrinhoContext'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, CheckCircle2, ShoppingBag } from 'lucide-react'

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

function formatWhatsApp(value: string) {
  return value.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2')
    .slice(0, 15)
}

function formatCEP(value: string) {
  return value.replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)
}

function formatCPF(value: string) {
  return value.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
]

interface DadosPessoais {
  nome: string
  whatsapp: string
  email: string
  cpf: string
}

interface DadosEndereco {
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

const passos = ['Dados pessoais', 'Endereço', 'Confirmação']

export default function CheckoutPage() {
  const { itens, totalPreco, limparCarrinho } = useCarrinho()
  const router = useRouter()

  const [hidratado, setHidratado] = useState(false)
  const [passo, setPasso] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => { setHidratado(true) }, [])

  const [pessoais, setPessoais] = useState<DadosPessoais>({
    nome: '', whatsapp: '', email: '', cpf: ''
  })

  const [endereco, setEndereco] = useState<DadosEndereco>({
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
  })

  const [buscandoCEP, setBuscandoCEP] = useState(false)

  if (!hidratado) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (itens.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShoppingBag className="w-16 h-16 text-zinc-300" />
        <p className="text-xl font-semibold text-zinc-700">Seu carrinho está vazio</p>
        <Link href="/produtos" className="mt-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-zinc-700 transition-colors">
          Ver produtos
        </Link>
      </div>
    )
  }

  async function buscarCEP(cep: string) {
    const raw = cep.replace(/\D/g, '')
    if (raw.length !== 8) return
    setBuscandoCEP(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setEndereco(prev => ({
          ...prev,
          endereco: data.logradouro ?? prev.endereco,
          bairro: data.bairro ?? prev.bairro,
          cidade: data.localidade ?? prev.cidade,
          estado: data.uf ?? prev.estado,
        }))
      }
    } catch {}
    setBuscandoCEP(false)
  }

  function validarPasso0() {
    if (!pessoais.nome.trim()) return 'Informe seu nome completo'
    if (pessoais.whatsapp.replace(/\D/g, '').length < 10) return 'WhatsApp inválido'
    if (!pessoais.email.includes('@')) return 'E-mail inválido'
    return null
  }

  function validarPasso1() {
    if (endereco.cep.replace(/\D/g, '').length !== 8) return 'CEP inválido'
    if (!endereco.endereco.trim()) return 'Informe o endereço'
    if (!endereco.numero.trim()) return 'Informe o número'
    if (!endereco.cidade.trim()) return 'Informe a cidade'
    if (!endereco.estado) return 'Selecione o estado'
    return null
  }

  function avancar() {
    setErro(null)
    const erroValidacao = passo === 0 ? validarPasso0() : validarPasso1()
    if (erroValidacao) { setErro(erroValidacao); return }
    setPasso(p => p + 1)
  }

  async function finalizar() {
    setErro(null)
    setEnviando(true)
    try {
      const enderecoCompleto = [
        endereco.endereco,
        endereco.numero,
        endereco.complemento,
        endereco.bairro,
        `${endereco.cidade} - ${endereco.estado}`,
        `CEP ${endereco.cep}`
      ].filter(Boolean).join(', ')

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            nome: pessoais.nome.trim(),
            whatsapp: pessoais.whatsapp.replace(/\D/g, ''),
            email: pessoais.email.trim(),
            cpf: pessoais.cpf.replace(/\D/g, '') || null,
            endereco: enderecoCompleto,
            cidade: endereco.cidade,
            estado: endereco.estado,
            cep: endereco.cep.replace(/\D/g, ''),
          },
          itens: itens.map(i => ({
            variacaoId: i.variacaoId,
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            precoUnitario: i.preco,
            nome: `${i.produtoNome} — ${i.variacaoNome}`,
          })),
          total: totalPreco,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.erro ?? 'Erro ao criar pedido')

      // Montar mensagem WhatsApp
      const linhasItens = itens.map(i =>
        `• ${i.produtoNome} (${i.variacaoNome}) x${i.quantidade} — ${formatBRL(i.preco * i.quantidade)}`
      ).join('\n')

      const msg = encodeURIComponent(
        `Olá! Fiz um pedido na loja 🛍️\n\n` +
        `*Pedido #${data.numero}*\n\n` +
        `${linhasItens}\n\n` +
        `*Total: ${formatBRL(totalPreco)}*\n\n` +
        `*Meus dados:*\n` +
        `Nome: ${pessoais.nome}\n` +
        `WhatsApp: ${pessoais.whatsapp}\n` +
        `E-mail: ${pessoais.email}\n` +
        (pessoais.cpf ? `CPF: ${pessoais.cpf}\n` : '') +
        `\n*Entrega:*\n${enderecoCompleto}`
      )

      limparCarrinho()

      // Abrir WhatsApp com o número da loja
      window.open(`https://wa.me/${data.whatsapp}?text=${msg}`, '_blank')

      router.push(`/pedido-confirmado?numero=${data.numero}`)
    } catch (e: any) {
      setErro(e.message ?? 'Erro inesperado')
    }
    setEnviando(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Indicador de passos */}
      <div className="flex items-center gap-0 mb-8 sm:mb-10">
        {passos.map((nome, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < passo ? 'bg-zinc-900 text-white' :
                i === passo ? 'bg-zinc-900 text-white' :
                'bg-zinc-100 text-zinc-400'
              }`}>
                {i < passo ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === passo ? 'text-zinc-900 font-semibold' : 'text-zinc-400'}`}>
                {nome}
              </span>
            </div>
            {i < passos.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 ${i < passo ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Resumo do carrinho (sempre visível) */}
      <div className="bg-zinc-50 rounded-2xl p-4 mb-6 border border-zinc-100">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Resumo do pedido</p>
        <div className="flex flex-col gap-2">
          {itens.map(item => (
            <div key={item.variacaoId} className="flex items-center gap-3">
              {item.foto && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-200">
                  <Image src={item.foto} alt={item.produtoNome} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-800 font-medium line-clamp-1">{item.produtoNome}</p>
                <p className="text-xs text-zinc-400">{item.variacaoNome} · x{item.quantidade}</p>
              </div>
              <p className="text-sm font-bold text-zinc-900 flex-shrink-0">{formatBRL(item.preco * item.quantidade)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-200 mt-3 pt-3 flex justify-between items-center">
          <span className="text-sm text-zinc-500">Total</span>
          <span className="text-lg font-bold text-zinc-900">{formatBRL(totalPreco)}</span>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {erro}
        </div>
      )}

      {/* Passo 0 — Dados pessoais */}
      {passo === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-zinc-900">Dados pessoais</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nome completo *</label>
            <input
              type="text"
              value={pessoais.nome}
              onChange={e => setPessoais(p => ({ ...p, nome: e.target.value }))}
              placeholder="Seu nome completo"
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">WhatsApp *</label>
            <input
              type="tel"
              value={pessoais.whatsapp}
              onChange={e => setPessoais(p => ({ ...p, whatsapp: formatWhatsApp(e.target.value) }))}
              placeholder="(11) 99999-9999"
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">E-mail *</label>
            <input
              type="email"
              value={pessoais.email}
              onChange={e => setPessoais(p => ({ ...p, email: e.target.value }))}
              placeholder="seuemail@exemplo.com"
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              CPF <span className="text-zinc-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={pessoais.cpf}
              onChange={e => setPessoais(p => ({ ...p, cpf: formatCPF(e.target.value) }))}
              placeholder="000.000.000-00"
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <button
            onClick={avancar}
            className="mt-2 w-full bg-zinc-900 hover:bg-zinc-700 text-white font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
          >
            Continuar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Passo 1 — Endereço */}
      {passo === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-zinc-900">Endereço de entrega</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">CEP *</label>
            <div className="relative">
              <input
                type="text"
                value={endereco.cep}
                onChange={e => {
                  const val = formatCEP(e.target.value)
                  setEndereco(p => ({ ...p, cep: val }))
                  if (val.replace(/\D/g, '').length === 8) buscarCEP(val)
                }}
                placeholder="00000-000"
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              {buscandoCEP && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">Buscando...</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Logradouro *</label>
            <input
              type="text"
              value={endereco.endereco}
              onChange={e => setEndereco(p => ({ ...p, endereco: e.target.value }))}
              placeholder="Rua, Avenida..."
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Número *</label>
              <input
                type="text"
                value={endereco.numero}
                onChange={e => setEndereco(p => ({ ...p, numero: e.target.value }))}
                placeholder="123"
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Complemento</label>
              <input
                type="text"
                value={endereco.complemento}
                onChange={e => setEndereco(p => ({ ...p, complemento: e.target.value }))}
                placeholder="Apto, bloco..."
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Bairro</label>
            <input
              type="text"
              value={endereco.bairro}
              onChange={e => setEndereco(p => ({ ...p, bairro: e.target.value }))}
              placeholder="Bairro"
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Cidade *</label>
              <input
                type="text"
                value={endereco.cidade}
                onChange={e => setEndereco(p => ({ ...p, cidade: e.target.value }))}
                placeholder="Sua cidade"
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Estado *</label>
              <select
                value={endereco.estado}
                onChange={e => setEndereco(p => ({ ...p, estado: e.target.value }))}
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
              >
                <option value="">UF</option>
                {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => { setErro(null); setPasso(0) }}
              className="flex-1 border border-zinc-200 text-zinc-600 font-semibold py-3 rounded-full hover:bg-zinc-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={avancar}
              className="flex-1 bg-zinc-900 hover:bg-zinc-700 text-white font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Passo 2 — Confirmação */}
      {passo === 2 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-zinc-900">Confirmar pedido</h2>

          <div className="border border-zinc-100 rounded-2xl overflow-hidden">
            <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-100">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Dados pessoais</p>
            </div>
            <div className="px-4 py-4 flex flex-col gap-1.5 text-sm">
              <p><span className="text-zinc-500">Nome:</span> <span className="font-medium">{pessoais.nome}</span></p>
              <p><span className="text-zinc-500">WhatsApp:</span> <span className="font-medium">{pessoais.whatsapp}</span></p>
              <p><span className="text-zinc-500">E-mail:</span> <span className="font-medium">{pessoais.email}</span></p>
              {pessoais.cpf && <p><span className="text-zinc-500">CPF:</span> <span className="font-medium">{pessoais.cpf}</span></p>}
            </div>
          </div>

          <div className="border border-zinc-100 rounded-2xl overflow-hidden">
            <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-100">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Endereço de entrega</p>
            </div>
            <div className="px-4 py-4 text-sm text-zinc-700 leading-relaxed">
              {endereco.endereco}, {endereco.numero}
              {endereco.complemento && `, ${endereco.complemento}`}
              {endereco.bairro && ` — ${endereco.bairro}`}
              <br />
              {endereco.cidade} - {endereco.estado} · CEP {endereco.cep}
            </div>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Pagamento</p>
            <p className="text-sm text-zinc-700">💬 A combinar via WhatsApp após confirmação do pedido</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setErro(null); setPasso(1) }}
              className="flex-1 border border-zinc-200 text-zinc-600 font-semibold py-3 rounded-full hover:bg-zinc-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={finalizar}
              disabled={enviando}
              className="flex-1 bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-400 text-white font-semibold py-3 rounded-full transition-colors"
            >
              {enviando ? 'Enviando...' : 'Confirmar pedido'}
            </button>
          </div>

          <p className="text-xs text-zinc-400 text-center">
            Ao confirmar, você será redirecionado ao WhatsApp para finalizar com a loja.
          </p>
        </div>
      )}
    </div>
  )
}