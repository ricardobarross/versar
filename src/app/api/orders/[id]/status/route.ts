import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, assertUuid, HttpError } from '@/lib/api'
import { ORDER_STATUSES, isOrderStatus } from '@/lib/orders'

type Ctx = { params: { id: string } }

export async function GET(req: Request, { params }: Ctx) {
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    const { data, error } = await supabase.from('orders').select('status').eq('id', params.id).maybeSingle()
    if (error) throw new HttpError(500, 'Erro ao buscar pedido.')
    if (!data) throw new HttpError(404, 'Pedido não encontrado.')
    return NextResponse.json({ status: data.status })
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    const { status } = await readJson<{ status?: string }>(req)
    if (!isOrderStatus(status)) {
      throw new HttpError(400, `Status inválido. Permitidos: ${ORDER_STATUSES.join(', ')}`)
    }
    const data = check(
      await supabase.from('orders').update({ status }).eq('id', params.id).select().single(),
      'Erro ao atualizar status.'
    )
    return NextResponse.json({ success: true, message: 'Status atualizado com sucesso.', data })
  } catch (err) {
    return apiError(err)
  }
}
