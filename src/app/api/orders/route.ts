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

// POST /api/orders  { customer_id?, status?, payment_method?, notes?, items: [{ product_id, variation_id?, quantity, unit_price? }] }
// Usa a mesma função do painel: valida e dá baixa no estoque numa transação.
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const body = await readJson<{
      customer_id?: string; status?: string; payment_method?: string; notes?: string; items?: NewItem[]
    }>(req)

    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) throw new HttpError(400, 'O pedido deve conter pelo menos 1 item.')
    for (const it of items) {
      if (!it.product_id || !UUID_RE.test(it.product_id)) throw new HttpError(400, 'Item com product_id inválido.')
      if (it.variation_id && !UUID_RE.test(it.variation_id)) throw new HttpError(400, 'Item com variation_id inválido.')
      if (!Number.isInteger(it.quantity) || (it.quantity ?? 0) <= 0) throw new HttpError(400, 'Quantidade inválida.')
      if (it.unit_price !== undefined && (typeof it.unit_price !== 'number' || it.unit_price < 0)) {
        throw new HttpError(400, 'Preço unitário inválido.')
      }
    }
    if (body.status && (!isOrderStatus(body.status) || body.status === 'canceled')) throw new HttpError(400, 'Status inválido.')

    const { data, error } = await supabase.rpc('admin_create_order', {
      p_customer_id: body.customer_id ?? null,
      p_status: body.status ?? 'new',
      p_payment_method: body.payment_method ?? null,
      p_notes: body.notes ?? null,
      p_items: items,
    })
    if (error) {
      if (error.message.includes('ORDER:OUT_OF_STOCK')) {
        throw new HttpError(409, `Estoque insuficiente: ${error.message.split('ORDER:OUT_OF_STOCK:')[1]}`)
      }
      if (error.message.includes('ORDER:UNAVAILABLE')) throw new HttpError(409, 'Produto ou variação inexistente.')
      throw new HttpError(500, 'Erro ao criar pedido.')
    }

    const pedido = data as { order_id: string; numero: number; total: number }
    return NextResponse.json(
      { success: true, message: 'Pedido criado com sucesso.', order_id: pedido.order_id, numero: pedido.numero, total: Number(pedido.total) },
      { status: 201 }
    )
  } catch (err) {
    return apiError(err)
  }
}
