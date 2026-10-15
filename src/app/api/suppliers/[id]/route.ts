import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, pick, assertUuid, HttpError } from '@/lib/api'
import { SUPPLIER_FIELDS } from '@/lib/fields'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(
  req: Request,
  ctx: Ctx
) {
  const params = await ctx.params
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', params.id).maybeSingle()
    if (error) throw new HttpError(500, 'Erro ao buscar fornecedor.')
    if (!data) throw new HttpError(404, 'Fornecedor não encontrado.')
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(
  req: Request,
  ctx: Ctx
) {
  const params = await ctx.params
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    const body = pick(await readJson(req), SUPPLIER_FIELDS)
    const data = check(
      await supabase.from('suppliers').update(body).eq('id', params.id).select().single(),
      'Erro ao atualizar fornecedor.'
    )
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(
  req: Request,
  ctx: Ctx
) {
  const params = await ctx.params
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    check(await supabase.from('suppliers').delete().eq('id', params.id), 'Erro ao apagar fornecedor.')
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err)
  }
}
