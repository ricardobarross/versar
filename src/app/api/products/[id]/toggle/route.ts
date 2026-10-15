import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, assertUuid, HttpError } from '@/lib/api'

// POST /api/products/[id]/toggle — ativa/desativa o produto na loja
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)

    const { data: product, error } = await supabase
      .from('products')
      .select('is_active')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw new HttpError(500, 'Erro ao buscar produto.')
    if (!product) throw new HttpError(404, 'Produto não encontrado.')

    const data = check(
      await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', params.id)
        .select('id, is_active')
        .single(),
      'Erro ao alterar o estado do produto.'
    )
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return apiError(err)
  }
}
