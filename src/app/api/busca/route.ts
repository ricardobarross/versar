import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/busca?q=camisa — busca pública de produtos ativos (RLS limita aos ativos)
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 80)
  if (q.length < 2) return NextResponse.json({ success: true, results: [] })

  // escapa os curingas do LIKE para a pesquisa ser literal
  const term = q.replace(/[\\%_]/g, m => `\\${m}`)

  const { data, error } = await createClient()
    .from('products')
    .select('id, name, slug, price, promo_price, product_images(url, order)')
    .eq('is_active', true)
    .ilike('name', `%${term}%`)
    .order('name')
    .limit(20)

  if (error) return NextResponse.json({ success: false, error: 'Erro na busca.' }, { status: 500 })
  return NextResponse.json({ success: true, results: data })
}
