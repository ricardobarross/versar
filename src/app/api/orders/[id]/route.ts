import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, pick, assertUuid, HttpError } from '@/lib/api'
import { ORDER_FIELDS } from '@/lib/fields'
import { isOrderStatus } from '@/lib/orders'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(
  req: Request,
  ctx: Ctx
) {
  const params = await ctx.params
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(*), order_items(id, product_id, variation_id, quantity, unit_price, products(name))')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw new HttpError(500, 'Erro ao buscar pedido.')
    if (!data) throw new HttpError(404, 'Pedido não encontrado.')
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
}

// PUT altera os dados do pedido (não os itens nem o total).
export async function PUT(
  req: Request,
  ctx: Ctx
) {
  const params = await ctx.params
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    const body = pick(await readJson(req), ORDER_FIELDS)
    if ('status' in body && !isOrderStatus(body.status)) throw new HttpError(400, 'Status inválido.')
    const data = check(
      await supabase.from('orders').update(body).eq('id', params.id).select().single(),
      'Erro ao atualizar pedido.'
    )
    return NextResponse.json({ success: true, message: 'Pedido atualizado com sucesso.', data })
  } catch (err) {
    return apiError(err)
  }
}

// Os itens são apagados em cascata.
export async function DELETE(
  req: Request,
  ctx: Ctx
) {
  const params = await ctx.params
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    check(await supabase.from('orders').delete().eq('id', params.id), 'Erro ao apagar pedido.')
    return NextResponse.json({ success: true, message: 'Pedido removido com sucesso.' })
  } catch (err) {
    return apiError(err)
  }
}
