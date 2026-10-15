import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, pick, HttpError } from '@/lib/api'
import { SUPPLIER_FIELDS } from '@/lib/fields'

export const dynamic = 'force-dynamic'

// GET /api/suppliers?active=true|false
export async function GET(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const active = new URL(req.url).searchParams.get('active')
    let query = supabase.from('suppliers').select('*').order('name')
    if (active === 'true' || active === 'false') query = query.eq('is_active', active === 'true')
    return NextResponse.json(check(await query, 'Erro ao buscar fornecedors.'))
  } catch (err) {
    return apiError(err)
  }
}

// POST /api/suppliers
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const body = pick(await readJson(req), SUPPLIER_FIELDS)
    if (!body.name) throw new HttpError(400, 'Campo obrigatório: name.')
    const data = check(await supabase.from('suppliers').insert(body).select().single(), 'Erro ao criar fornecedor.')
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
