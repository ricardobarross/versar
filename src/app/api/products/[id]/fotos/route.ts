import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, assertUuid, HttpError } from '@/lib/api'

type Ctx = { params: { id: string } }

// GET /api/products/[id]/fotos
export async function GET(req: Request, { params }: Ctx) {
  try {
    assertUuid(params.id, 'ID do produto')
    const { supabase } = await requireAdmin(req)
    const data = check(
      await supabase.from('product_images').select('*').eq('product_id', params.id).order('order'),
      'Erro ao buscar fotos.'
    )
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
}

// POST /api/products/[id]/fotos  { url, order? }
export async function POST(req: Request, { params }: Ctx) {
  try {
    assertUuid(params.id, 'ID do produto')
    const { supabase } = await requireAdmin(req)
    const { url, order } = await readJson<{ url?: string; order?: number }>(req)
    if (!url) throw new HttpError(400, 'Campo obrigatório: url.')

    const data = check(
      await supabase
        .from('product_images')
        .insert({ product_id: params.id, url, order: Number(order ?? 0) })
        .select()
        .single(),
      'Erro ao adicionar foto.'
    )
    return NextResponse.json({ success: true, message: 'Foto adicionada com sucesso.', data }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
