'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus } from 'lucide-react'
import type { Customer, Product, Order } from '@/types'

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

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'picking', label: 'Picking' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'canceled', label: 'Canceled' },
]

export default function OrderForm({ customers, products, order }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [customerId, setCustomerId] = useState(order?.customer_id ?? '')
  const [status, setStatus] = useState(order?.status ?? 'new')
  const [paymentMethod, setPaymentMethod] = useState(order?.payment_method ?? '')
  const [items, setItems] = useState<ItemForm[]>(
    order?.order_items?.map((i: any) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: i.price,
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
        return { ...item, product_id: value, product_name: product?.name ?? '', price: product?.price ?? 0 }
      }
      return { ...item, [field]: value }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const orderData = {
        customer_id: customerId || null,
        status,
        payment_method: paymentMethod || null,
        total,
        origin: 'whatsapp',
      }

      let orderId = order?.id

      if (orderId) {
        await supabase.from('orders').update(orderData).eq('id', orderId)
        await supabase.from('order_items').delete().eq('order_id', orderId)
      } else {
        const { data, error } = await supabase.from('orders').insert(orderData).select().single()
        if (error) throw error
        orderId = data.id
      }

      if (items.length > 0) {
        await supabase.from('order_items').insert(
          items.map(item => ({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          }))
        )
      }

      router.push('/admin/pedidos')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Error saving order.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Order Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Customer</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
              <option value="">Select customer</option>
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
          <label className="block text-zinc-400 text-sm mb-2">Payment method</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
            <option value="">Select</option>
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
          <h2 className="text-white font-semibold">Order Items</h2>
          <button type="button" onClick={addItem}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <Plus size={16} /> Add item
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-zinc-500 text-sm">No items added.</p>
        )}

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-start bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
              <div className="col-span-6">
                <label className="block text-zinc-500 text-xs mb-1">Product</label>
                <select value={item.product_id} onChange={e => updateItem(index, 'product_id', e.target.value)}
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 text-sm focus:outline-none">
                  <option value="">Select</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-zinc-500 text-xs mb-1">Qty</label>
                <input type="number" value={item.quantity}
                  onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 text-sm focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-zinc-500 text-xs mb-1">Price</label>
                <div className="text-white pt-2 text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                </div>
              </div>
              <div className="col-span-1 pt-6">
                <button type="button" onClick={() => removeItem(index)} className="text-zinc-500 hover:text-red-400">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-zinc-400">Order Total:</span>
          <span className="text-2xl font-bold text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
          </span>
        </div>
      </div>

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors disabled:opacity-50">
        {loading ? 'Saving...' : order ? 'Update Order' : 'Create Order'}
      </button>
    </form>
  )
}