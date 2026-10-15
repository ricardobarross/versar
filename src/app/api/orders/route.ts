import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, HttpError, UUID_RE } from '@/lib/api'
import { isOrderStatus } from '@/lib/orders'

export const dynamic = 'force-dynamic'

const ITEMS_SELECT = 'order_items(id, product_id, variation_id, quantity, unit_price)'

// GET /api/orders?status=
export async function GET(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const status = new URL(req.url).searchParams.get('status')
    let query = supabase.from('orders').select(`*, customers(id, name, whatsapp), ${ITEMS_SELECT}`).order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    return NextResponse.json(check(await query, 'Erro ao buscar pedidos.'))
  } catch (err) {
    return apiError(err)
  }
}

type NewItem = { product_id?: string; variation_id?: string | null; quantity?: number; unit_price?: number }

// POST /api/orders  { customer_id?, status?, payment_method?, origin?, notes?, items: [{ product_id, variation_id?, quantity, unit_price }] }
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const body = await readJson<{
      customer_id?: string; status?: string; payment_method?: string; origin?: string; notes?: string; items?: NewItem[]
    }>(req)

    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) throw new HttpError(400, 'O pedido deve conter pelo menos 1 item.')
    for (const it of items) {
      if (!it.product_id || !UUID_RE.test(it.product_id)) throw new HttpError(400, 'Item com product_id inválido.')
      if (!Number.isInteger(it.quantity) || (it.quantity ?? 0) <= 0) throw new HttpError(400, 'Quantidade inválida.')
      if (typeof it.unit_price !== 'number' || it.unit_price < 0) throw new HttpError(400, 'Preço unitário inválido.')
    }
    if (body.status && !isOrderStatus(body.status)) throw new HttpError(400, 'Status inválido.')

    const total = items.reduce((acc, it) => acc + it.unit_price! * it.quantity!, 0)

    const order = check(
      await supabase
        .from('orders')
        .insert({
          customer_id: body.customer_id ?? null,
          status: body.status ?? 'new',
          payment_method: body.payment_method ?? null,
          origin: body.origin ?? 'whatsapp',
          notes: body.notes ?? null,
          total: Math.round(total * 100) / 100,
        })
        .select('id, numero')
        .single<{ id: string; numero: number }>(),
      'Erro ao criar pedido.'
    )
    if (!order) throw new HttpError(500, 'Erro ao criar pedido.')

    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map(it => ({
        order_id: order.id,
        product_id: it.product_id,
        variation_id: it.variation_id ?? null,
        quantity: it.quantity,
        unit_price: it.unit_price,
      }))
    )
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id)
      throw new HttpError(500, 'Erro ao gravar os itens do pedido.')
    }

    return NextResponse.json({ success: true, message: 'Pedido criado com sucesso.', order_id: order.id, numero: order.numero }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
