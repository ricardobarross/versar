'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus } from 'lucide-react'
import type { Cliente, Produto, Pedido } from '@/types'

type ItemForm = {
  produto_id: string
  variacao_id: string
  quantidade: number
  preco_unitario: number
  nome_produto: string
}

type Props = {
  clientes: Cliente[]
  produtos: (Produto & { produto_variacoes?: any[] })[]
  pedido?: Pedido & { pedido_itens?: any[] }
}

const STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'separando', label: 'Separando' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
]

export default function PedidoForm({ clientes, produtos, pedido }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [clienteId, setClienteId] = useState(pedido?.cliente_id ?? '')
  const [status, setStatus] = useState(pedido?.status ?? 'novo')
  const [formaPagamento, setFormaPagamento] = useState(pedido?.forma_pagamento ?? '')
  const [observacoes, setObservacoes] = useState(pedido?.observacoes ?? '')
  const [itens, setItens] = useState<ItemForm[]>(
    pedido?.pedido_itens?.map((i: any) => ({
      produto_id: i.produto_id,
      variacao_id: i.variacao_id ?? '',
      quantidade: i.quantidade,
      preco_unitario: i.preco_unitario,
      nome_produto: i.produtos?.nome ?? '',
    })) ?? []
  )

  const total = itens.reduce((acc, i) => acc + i.quantidade * i.preco_unitario, 0)

  function adicionarItem() {
    setItens(prev => [...prev, {
      produto_id: '',
      variacao_id: '',
      quantidade: 1,
      preco_unitario: 0,
      nome_produto: '',
    }])
  }

  function removerItem(index: number) {
    setItens(prev => prev.filter((_, i) => i !== index))
  }

  function atualizarItem(index: number, campo: keyof ItemForm, valor: any) {
    setItens(prev => prev.map((item, i) => {
      if (i !== index) return item
      if (campo === 'produto_id') {
        const produto = produtos.find(p => p.id === valor)
        return {
          ...item,
          produto_id: valor,
          nome_produto: produto?.nome ?? '',
          preco_unitario: produto?.preco ?? 0,
          variacao_id: '',
        }
      }
      return { ...item, [campo]: valor }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const dadosPedido = {
        cliente_id: clienteId || null,
        status,
        forma_pagamento: formaPagamento || null,
        observacoes: observacoes || null,
        total,
        origem: 'whatsapp',
      }

      let pedidoId = pedido?.id

      if (pedidoId) {
        await supabase.from('pedidos').update(dadosPedido).eq('id', pedidoId)
        await supabase.from('pedido_itens').delete().eq('pedido_id', pedidoId)
      } else {
        const { data, error } = await supabase.from('pedidos').insert(dadosPedido).select().single()
        if (error) throw error
        pedidoId = data.id
      }

      if (itens.length > 0) {
        await supabase.from('pedido_itens').insert(
          itens.map(item => ({
            pedido_id: pedidoId,
            produto_id: item.produto_id,
            variacao_id: item.variacao_id || null,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
          }))
        )
      }

      router.push('/admin/pedidos')
      router.refresh()
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao salvar pedido.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {/* Cabeçalho */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Informações do pedido</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Cliente</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
              <option value="">Selecionar cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Forma de pagamento</label>
          <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
            <option value="">Selecionar</option>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão de crédito">Cartão de crédito</option>
            <option value="Cartão de débito">Cartão de débito</option>
            <option value="Boleto">Boleto</option>
          </select>
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Observações</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none resize-none"
            placeholder="Ex: Entregar no período da tarde..." />
        </div>
      </div>

      {/* Itens */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Itens do pedido</h2>
          <button type="button" onClick={adicionarItem}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <Plus size={16} /> Adicionar item
          </button>
        </div>

        {itens.length === 0 && (
          <p className="text-zinc-500 text-sm">Nenhum item adicionado.</p>
        )}

        <div className="space-y-3">
          {itens.map((item, index) => {
            const produto = produtos.find(p => p.id === item.produto_id)
            const variacoes = produto?.produto_variacoes ?? []

            return (
              <div key={index} className="grid grid-cols-12 gap-3 items-sta