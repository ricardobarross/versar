'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus } from 'lucide-react'
import type { Customer, Product, Order } from '@/types'
import { ORDER_STATUSES, ORDER_STATUS_META } from '@/lib/orders'

type ItemForm = {
  product_id: string
  quantity: number
  price: number
  product_name: string
}

type Props = {
  customers: Customer[]
  products: Product[]
  order?: Order & { order_items?: any[] }
}

const STATUS_OPTIONS = ORDER_STATUSES.map(value => ({ value, label: ORDER_STATUS_META[value].label }))

export default function OrderForm({ customers, products, order }: Props) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  // pedidos da loja já deram baixa no estoque: os itens não se editam aqui
  const itensBloqueados = Boolean((order as { stock_reserved?: boolean } | undefined)?.stock_reserved)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [customerId, setCustomerId] = useState(order?.customer_id ?? '')
  const [status, setStatus] = useState(order?.status ?? 'new')
  const [paymentMethod, setPaymentMethod] = useState(order?.payment_method ?? '')
  const [items, setItems] = useState<ItemForm[]>(
    order?.order_items?.map((i: any) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: Number(i.price ?? i.unit_price ?? 0),
      product_name: i.products?.name ?? '',
    })) ?? []
  )

  const total = items.reduce((acc, i) => acc + i.quantity * i.price, 0)

  function addItem() {
    setItems(prev => [...prev, { product_id: '', quantity: 1, price: 0, product_name: '' }])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof ItemForm, value: any) {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      if (field === 'product_id') {
        const product = products.find(p => p.id === value)
        const preco = Number(product?.promo_price ?? product?.price ?? 0)
        return { ...item, product_id: value, product_name: product?.name ?? '', price: preco }
      }
      return { ...item, [field]: value }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (!itensBloqueados) {
        if (items.some(i => !i.product_id)) throw new Error('Escolha o produto de todos os itens.')
        if (items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1)) throw new Error('Quantidade inválida.')
      }

      const orderData: Record<string, unknown> = {
        customer_id: customerId || null,
        status,
        payment_method: paymentMethod || null,
      }
      if (!itensBloqueados) orderData.total = Math.round(total * 100) / 100

      let orderId = order?.id

      if (orderId) {
        const { error } = await supabase.from('orders').update(orderData).eq('id', orderId)
        if (error) throw error
        if (!itensBloqueados) {
          const { error: delError } = await supabase.from('order_items').delete().eq('order_id', orderId)
          if (delError) throw delError
        }
      } else {
        const { data, error } = await supabase
          .from('orders')
          .insert({ ...orderData, origin: 'whatsapp' })
          .select('id')
          .single()
        if (error) throw error
        orderId = data.id
      }

      if (!itensBloqueados && items.length > 0) {
        const { error: itemsError } = await supabase.from('order_items').insert(
          items.map(item => ({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.price,
          }))
        )
        if (itemsError) throw itemsError
      }

      router.push('/admin/pedidos')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Erro ao salvar o pedido.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Dados do pedido</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Cliente</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
              <option value="">Selecione o cliente</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
            <option value="">Selecione</option>
            <option value="Pix">Pix</option>
            <option value="Cash">Cash</option>
            <option value="Credit card">Credit card</option>
            <option value="Debit card">Debit card</option>
            <option value="Boleto">Boleto</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Itens do pedido</h2>
          {!itensBloqueados && <button type="button" onClick={addItem}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <Plus size={16} /> Adicionar item
          </button>}
        </div>

        {itensBloqueados && (
          <p className="text-zinc-400 text-xs bg-zinc-800 rounded-lg px-3 py-2">
            Pedido feito pela loja online: os itens e o total são fixos (o estoque já foi reservado).
            Para alterar, cancele este pedido — o estoque volta automaticamente — e crie outro.
          </p>
        )}

        {items.length === 0 && (
          <p className="text-zinc-500 text-sm">Nenhum item adicionado.</p>
        )}

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-start bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
              <div className="col-span-6">
                <label className="block text-zinc-500 text-xs mb-1">Produto</label>
                <select value={item.product_id} disabled={itensBloqueados} onChange={e => updateItem(index, 'product_id', e.target.value)}
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 text-sm focus:outline-none">
                  <option value="">Selecione</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-zinc-500 text-xs mb-1">Qtd.</label>
                <input type="number" min={1} value={item.quantity} disabled={itensBloqueados}
                  onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 text-sm focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-zinc-500 text-xs mb-1">Preço</label>
                <div className="text-white pt-2 text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                </div>
              </div>
              <div className="col-span-1 pt-6">
                {!itensBloqueados && (
                  <button type="button" onClick={() => removeItem(index)} className="text-zinc-500 hover:text-red-400" aria-label="Remover item">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-zinc-400">Total do pedido:</span>
          <span className="text-2xl font-bold text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
          </span>
        </div>
      </div>

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors disabled:opacity-50">
        {loading ? 'Salvando...' : order ? 'Atualizar pedido' : 'Criar pedido'}
      </button>
    </form>
  )
}