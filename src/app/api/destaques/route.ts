import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, HttpError, UUID_RE } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const data = check(
      await supabase.from('destaques').select('*, products(name, price, is_active)').order('ordem'),
      'Erro ao buscar destaques.'
    )
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const { product_id, ordem, ativo } = await readJson<{ product_id?: string; ordem?: number; ativo?: boolean }>(req)
    if (!product_id || !UUID_RE.test(product_id)) throw new HttpError(400, 'Campo obrigatório: product_id.')
    const data = check(
      await supabase
        .from('destaques')
        .insert({ product_id, ordem: ordem ?? 0, ativo: ativo ?? true })
        .select()
        .single(),
      'Erro ao criar destaque.'
    )
    return NextResponse.json({ success: true, message: 'Destaque criado com sucesso.', data }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
