'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus } from 'lucide-react'
import { ORDER_STATUSES, ORDER_STATUS_META, formatBRL } from '@/lib/orders'

export type ProdutoPedido = {
  id: string
  name: string
  price: number
  promo_price: number | null
  product_variations: { id: string; color: string | null; size: string | null; stock: number; price: number | null; is_active: boolean }[]
}

type ClientePedido = { id: string; name: string; whatsapp?: string | null }

type ItemExistente = {
  product_id: string | null
  variation_id: string | null
  quantity: number
  unit_price: number | null
  price: number | null
  products?: { name: string } | null
  product_variations?: { color: string | null; size: string | null } | null
}

export type PedidoExistente = {
  id: string
  numero: number
  customer_id: string | null
  status: string
  payment_method: string | null
  notes: string | null
  origin: string
  stock_reserved: boolean
  total: number
  order_items?: ItemExistente[]
}

type ItemForm = {
  product_id: string
  variation_id: string
  quantity: number
  price: string // texto do input (permite "79,90")
}

const FORMAS_PAGAMENTO = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Boleto', 'A combinar']
const STATUS_NOVO_PEDIDO = ORDER_STATUSES.filter(s => s !== 'canceled')

const precoBase = (p?: ProdutoPedido, v?: ProdutoPedido['product_variations'][number]) =>
  Number(v?.price ?? p?.promo_price ?? p?.price ?? 0)

const nomeVariacao = (v: { color: string | null; size: string | null }) =>
  [v.color, v.size].filter(Boolean).join(' / ') || 'Única'

const toNumber = (s: string) => Number(s.replace(',', '.'))

export default function PedidoForm({
  customers,
  products,
  order,
}: {
  customers: ClientePedido[]
  products: ProdutoPedido[]
  order?: PedidoExistente
}) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const editando = Boolean(order)
  const [customerId, setCustomerId] = useState(order?.customer_id ?? '')
  const [status, setStatus] = useState(order?.status ?? 'new')
  const [paymentMethod, setPaymentMethod] = useState(order?.payment_method ?? '')
  const [notes, setNotes] = useState(order?.notes ?? '')
  const [items, setItems] = useState<ItemForm[]>([])

  const produtosPorId = useMemo(() => new Map(products.map(p => [p.id, p])), [products])

  const total = items.reduce((acc, i) => acc + (toNumber(i.price) || 0) * i.quantity, 0)

  function addItem() {
    setItems(prev => [...prev, { product_id: '', variation_id: '', quantity: 1, price: '' }])
  }

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const next = { ...item, ...patch }
      const produto = produtosPorId.get(next.product_id)
      if (patch.product_id !== undefined) {
        // ao trocar de produto: escolhe a variação se só houver uma, e o preço base
        const variacoes = (produto?.product_variations ?? []).filter(v => v.is_active)
        next.variation_id = variacoes.length === 1 ? variacoes[0].id : ''
        next.price = produto ? precoBase(produto, variacoes.length === 1 ? variacoes[0] : undefined).toFixed(2).replace('.', ',') : ''
      }
      if (patch.variation_id !== undefined && produto) {
        const v = produto.product_variations.find(x => x.id === patch.variation_id)
        next.price = precoBase(produto, v).toFixed(2).replace('.', ',')
      }
      return next
    }))
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function mensagemErro(msg: string) {
    if (msg.includes('ORDER:OUT_OF_STOCK')) return `Estoque insuficiente: ${msg.split('ORDER:OUT_OF_STOCK:')[1]}`
    if (msg.includes('ORDER:UNAVAILABLE')) return 'Um dos produtos já não existe. Atualize a página.'
    if (msg.includes('ORDER:INVALID_STATUS')) return 'Um pedido novo não pode ser criado como cancelado.'
    if (msg.includes('ORDER:FORBIDDEN')) return 'Sem permissão para criar pedidos.'
    return msg
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (editando && order) {
        // Pedidos existentes: só os dados do pedido. Os itens ficam fixos
        // (o estoque já foi reservado); para mudar, cancele e crie outro.
        const { error } = await supabase
          .from('orders')
          .update({
            customer_id: customerId || null,
            status,
            payment_method: paymentMethod || null,
            notes: notes.trim() || null,
          })
          .eq('id', order.id)
        if (error) throw error
      } else {
        if (items.length === 0) throw new Error('Adicione pelo menos um item.')
        for (const it of items) {
          const produto = produtosPorId.get(it.product_id)
          if (!produto) throw new Error('Escolha o produto de todos os itens.')
          const ativas = produto.product_variations.filter(v => v.is_active)
          if (ativas.length > 0 && !it.variation_id) throw new Error(`Escolha a cor/tamanho de "${produto.name}".`)
          if (!Number.isInteger(it.quantity) || it.quantity < 1) throw new Error('Quantidade inválida.')
          const preco = toNumber(it.price)
          if (!Number.isFinite(preco) || preco < 0) throw new Error(`Preço inválido em "${produto.name}".`)
        }

        const { data, error } = await supabase.rpc('admin_create_order', {
          p_customer_id: customerId || null,
          p_status: status,
          p_payment_method: paymentMethod || null,
          p_notes: notes.trim() || null,
          p_items: items.map(it => ({
            product_id: it.product_id,
            variation_id: it.variation_id || null,
            quantity: it.quantity,
            unit_price: Math.round(toNumber(it.price) * 100) / 100,
          })),
        })
        if (error) throw new Error(mensagemErro(error.message))
        if (!data) throw new Error('Erro ao criar o pedido.')
      }

      router.push('/admin/pedidos')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(mensagemErro(err?.message ?? 'Erro ao salvar o pedido.'))
      setLoading(false)
    }
  }

  const input = 'w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none'
  const inputSm = 'w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 text-sm focus:outline-none focus:border-white disabled:opacity-50'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Dados do pedido</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Cliente</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={input}>
              <option value="">Sem cliente / balcão</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.whatsapp ? ` — ${c.whatsapp}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={input}>
              {(editando ? ORDER_STATUSES : STATUS_NOVO_PEDIDO).map(s => (
                <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>
              ))}
            </select>
            {editando && order?.stock_reserved && (
              <p className="text-zinc-500 text-xs mt-1">Cancelar devolve as peças ao estoque.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Forma de pagamento</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={input}>
              <option value="">Selecione</option>
              {[...new Set([...FORMAS_PAGAMENTO, ...(paymentMethod ? [paymentMethod] : [])])].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Observações</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={input}
              placeholder="Ex.: entregar depois das 18h" />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Itens do pedido</h2>
          {!editando && (
            <button type="button" onClick={addItem}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
              <Plus size={16} /> Adicionar item
            </button>
          )}
        </div>

        {editando ? (
          <>
            <p className="text-zinc-400 text-xs bg-zinc-800 rounded-lg px-3 py-2">
              Os itens de um pedido já criado são fixos{order?.stock_reserved ? ' (o estoque já foi reservado)' : ''}.
              Para mudar, cancele este pedido e crie outro.
            </p>
            <div className="divide-y divide-zinc-800">
              {(order?.order_items ?? []).map((it, idx) => {
                const preco = Number(it.unit_price ?? it.price ?? 0)
                return (
                  <div key={idx} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="text-white">{it.products?.name ?? 'Produto removido'}</p>
                      {it.product_variations && (
                        <p className="text-zinc-500 text-xs">{nomeVariacao(it.product_variations)}</p>
                      )}
                    </div>
                    <p className="text-zinc-300">{it.quantity} × {formatBRL(preco)}</p>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {items.length === 0 && <p className="text-zinc-500 text-sm">Nenhum item adicionado.</p>}
            <div className="space-y-3">
              {items.map((item, index) => {
                const produto = produtosPorId.get(item.product_id)
                const variacoes = (produto?.product_variations ?? []).filter(v => v.is_active)
                const variacao = variacoes.find(v => v.id === item.variation_id)
                const maxQtd = variacao ? variacao.stock : undefined
                return (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-zinc-500 text-xs mb-1">Produto</label>
                      <select value={item.product_id} onChange={e => updateItem(index, { product_id: e.target.value })} className={inputSm}>
                        <option value="">Selecione</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <label className="block text-zinc-500 text-xs mb-1">Cor / tamanho</label>
                      <select value={item.variation_id} disabled={variacoes.length === 0}
                        onChange={e => updateItem(index, { variation_id: e.target.value })} className={inputSm}>
                        <option value="">{variacoes.length === 0 ? '—' : 'Selecione'}</option>
                        {variacoes.map(v => (
                          <option key={v.id} value={v.id} disabled={v.stock === 0}>
                            {nomeVariacao(v)} ({v.stock === 0 ? 'esgotado' : `${v.stock} em estoque`})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-zinc-500 text-xs mb-1">Qtd.</label>
                      <input type="number" min={1} max={maxQtd} value={item.quantity}
                        onChange={e => updateItem(index, { quantity: Math.max(1, Math.trunc(Number(e.target.value)) || 1) })}
                        className={inputSm} />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-zinc-500 text-xs mb-1">Preço un. (R$)</label>
                      <input type="text" inputMode="decimal" value={item.price}
                        onChange={e => updateItem(index, { price: e.target.value })} className={inputSm} />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end pb-2">
                      <button type="button" onClick={() => removeItem(index)} className="text-zinc-500 hover:text-red-400" aria-label="Remover item">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {variacao && item.quantity > variacao.stock && (
                      <p className="col-span-12 text-amber-400 text-xs">Só há {variacao.stock} em estoque.</p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-zinc-400">Total do pedido:</span>
          <span className="text-2xl font-bold text-white">{formatBRL(editando ? order?.total : total)}</span>
        </div>
      </div>

      {errorMsg && <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{errorMsg}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors disabled:opacity-50">
        {loading ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar pedido'}
      </button>
    </form>
  )
}
