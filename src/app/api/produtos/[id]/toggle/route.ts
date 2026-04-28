import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: produto } = await supabase
    .from('produtos')
    .select('ativo')
    .eq('id', params.id)
    .single()

  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  await supabase
    .from('produtos')
    .update({ ativo: !produto.ativo })
    .eq('id', params.id)

  return NextResponse.redirect(new URL('/admin/produtos', request.url))
}