import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = createClient()
  const { type, id } = params

  try {
    if (type === 'customer') {
      // Buscar pedidos do cliente
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total, status, created_at, order_items(product_id, quantity, price, products(name))')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      const totalOrders = orders?.length ?? 0
      const totalSpent = orders?.reduce((acc, o) => acc + Number(o.total), 0) ?? 0

      const lastOrderDate = orders?.[0]?.created_at ?? null
      const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / 86400000)
        : null

      // Produtos mais comprados
      const productCount: Record<string, { name: string; quantity: number }> = {}
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const name = item.products?.name ?? item.product_id
          if (!productCount[item.product_id]) {
            productCount[item.product_id] = { name, quantity: 0 }
          }
          productCount[item.product_id].quantity += item.quantity
        })
      })

      const usualProducts = Object.values(productCount)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      // Pagamentos pendentes
      const { count: pendingPayments } = await supabase
        .from('accounts_payable')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Resumo IA simples (sem chamar LLM — lógica determinística)
      let aiSummary = ''
      if (totalOrders === 0) {
        aiSummary = 'This customer has no orders yet. Consider reaching out via WhatsApp to present new arrivals.'
      } else if (daysSinceLastOrder !== null && daysSinceLastOrder > 60) {
        aiSummary = `Customer hasn't ordered in ${daysSinceLastOrder} days. High churn risk — good time for a re-engagement message.`
      } else if (daysSinceLastOrder !== null && daysSinceLastOrder > 30) {
        aiSummary = `Customer is becoming inactive (${daysSinceLastOrder} days without ordering). Consider sending a promotion.`
      } else {
        aiSummary = `Active customer with ${totalOrders} order${totalOrders > 1 ? 's' : ''} and R$ ${totalSpent.toFixed(2).replace('.', ',')} spent. Keep nurturing the relationship.`
      }

      return NextResponse.json({
        totalOrders,
        totalSpent,
        lastOrder: lastOrderDate
          ? new Date(lastOrderDate).toLocaleDateString('pt-BR')
          : null,
        daysSinceLastOrder,
        usualProducts,
        pendingPayments: pendingPayments ?? 0,
        aiSummary,
      })
    }

    if (type === 'product') {
      // Vendas do produto
      const { data: items } = await supabase
        .from('order_items')
        .select('quantity, price')
        .eq('product_id', id)

      const totalSold = items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0
      const totalRevenue = items?.reduce((acc, i) => acc + i.quantity * Number(i.price), 0) ?? 0
      const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0

      // Stock total
      const { data: variations } = await supabase
        .from('product_variations')
        .select('stock')
        .eq('product_id', id)

      const totalStock = variations?.reduce((acc, v) => acc + (v.stock ?? 0), 0) ?? 0

      // Produto atual para categoria
      const { data: product } = await supabase
        .from('products')
        .select('name, category_id, price')
        .eq('id', id)
        .single()

      // Produtos similares (mesma categoria)
      let similarProducts: { name: string; price: number }[] = []
      if (product?.category_id) {
        const { data: similar } = await supabase
          .from('products')
          .select('name, price')
          .eq('category_id', product.category_id)
          .eq('is_active', true)
          .neq('id', id)
          .limit(5)

        similarProducts = similar?.map(p => ({ name: p.name, price: Number(p.price) })) ?? []
      }

      // Análise IA determinística
      let aiAnalysis = ''
      if (totalSold === 0) {
        aiAnalysis = 'This product has no sales yet. Check if it is active and visible in the store.'
      } else if (totalStock === 0) {
        aiAnalysis = `Product sold ${totalSold} units but is out of stock. Restock as soon as possible to avoid losing sales.`
      } else if (totalStock < 5) {
        aiAnalysis = `Low stock alert: only ${totalStock} units remaining. Product has sold ${totalSold} units — reorder soon.`
      } else {
        aiAnalysis = `Strong performer: ${totalSold} units sold, R$ ${totalRevenue.toFixed(2).replace('.', ',')} in revenue. Stock is healthy at ${totalStock} units.`
      }

      return NextResponse.json({
        totalSold,
        totalRevenue,
        totalStock,
        avgPrice,
        suggestedMargin: product?.price ? Number(product.price) * 0.4 : 0,
        similarProducts,
        aiAnalysis,
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}