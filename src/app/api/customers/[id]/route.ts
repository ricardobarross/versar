import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, pick, assertUuid, HttpError } from '@/lib/api'
import { CUSTOMER_FIELDS } from '@/lib/fields'

type Ctx = { params: { id: string } }

export async function GET(req: Request, { params }: Ctx) {
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    const { data, error } = await supabase.from('customers').select('*').eq('id', params.id).maybeSingle()
    if (error) throw new HttpError(500, 'Erro ao buscar cliente.')
    if (!data) throw new HttpError(404, 'Cliente não encontrado.')
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    const body = pick(await readJson(req), CUSTOMER_FIELDS)
    const data = check(
      await supabase.from('customers').update(body).eq('id', params.id).select().single(),
      'Erro ao atualizar cliente.'
    )
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    check(await supabase.from('customers').delete().eq('id', params.id), 'Erro ao apagar cliente.')
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err)
  }
}
