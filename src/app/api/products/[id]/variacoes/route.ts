import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, assertUuid, HttpError } from '@/lib/api'

type Ctx = { params: { id: string } }

// GET /api/products/[id]/variacoes
export async function GET(req: Request, { params }: Ctx) {
  try {
    assertUuid(params.id, 'ID do produto')
    const { supabase } = await requireAdmin(req)
    const data = check(
      await supabase.from('product_variations').select('*').eq('product_id', params.id).order('created_at'),
      'Erro ao buscar variações.'
    )
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
}

// POST /api/products/[id]/variacoes  { color?, size?, stock?, sku?, price? }
export async function POST(req: Request, { params }: Ctx) {
  try {
    assertUuid(params.id, 'ID do produto')
    const { supabase } = await requireAdmin(req)
    const b = await readJson<{ color?: string; size?: string; stock?: number; sku?: string; price?: number }>(req)
    if (!b.color && !b.size) throw new HttpError(400, 'Informe pelo menos a cor ou o tamanho.')
    const stock = Number(b.stock ?? 0)
    if (!Number.isInteger(stock) || stock < 0) throw new HttpError(400, 'Estoque inválido.')

    const data = check(
      await supabase
        .from('product_variations')
        .insert({
          product_id: params.id,
          color: b.color || null,
          size: b.size || null,
          name: [b.color, b.size].filter(Boolean).join(' / ') || null,
          sku: b.sku || null,
          price: b.price ?? null,
          stock,
        })
        .select()
        .single(),
      'Erro ao criar variação.'
    )
    return NextResponse.json({ success: true, message: 'Variação criada com sucesso.', data }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
