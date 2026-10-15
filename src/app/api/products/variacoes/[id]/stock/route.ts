import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, assertUuid, HttpError } from '@/lib/api'

/*
  POST /api/products/variacoes/[id]/stock
  { "operacao": "add", "valor": 5 }   → soma 5 ao estoque (negativo subtrai)
  { "operacao": "set", "valor": 20 }  → define estoque = 20
  Cada alteração fica registada em inventory_movements.
*/
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    const { operacao, valor, nota } = await readJson<{ operacao?: string; valor?: unknown; nota?: string }>(req)

    if (operacao !== 'add' && operacao !== 'set') throw new HttpError(400, "Operação inválida (use 'add' ou 'set').")
    if (typeof valor !== 'number' || !Number.isInteger(valor)) throw new HttpError(400, 'O valor deve ser um número inteiro.')

    const { data: variation, error } = await supabase
      .from('product_variations')
      .select('id, product_id, stock')
      .eq('id', params.id)
      .maybeSingle()
    if (error) throw new HttpError(500, 'Erro ao buscar variação.')
    if (!variation) throw new HttpError(404, 'Variação não encontrada.')

    const novo = operacao === 'add' ? variation.stock + valor : valor
    if (novo < 0) throw new HttpError(400, 'O estoque não pode ficar negativo.')

    const data = check(
      await supabase.from('product_variations').update({ stock: novo }).eq('id', params.id).select().single(),
      'Erro ao atualizar estoque.'
    )

    const delta = novo - variation.stock
    if (delta !== 0) {
      await supabase.from('inventory_movements').insert({
        product_id: variation.product_id,
        variation_id: variation.id,
        type: delta > 0 ? 'in' : 'out',
        quantity: Math.abs(delta),
        note: nota ?? (operacao === 'set' ? 'Ajuste manual de estoque' : null),
      })
    }

    return NextResponse.json({ success: true, message: 'Estoque atualizado com sucesso.', data })
  } catch (err) {
    return apiError(err)
  }
}
