import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, readJson, pick, HttpError } from '@/lib/api'
import { PRODUCT_FIELDS } from '@/lib/fields'

export const dynamic = 'force-dynamic'

// GET /api/products?category=&supplier=&active=true|false&featured=true
export async function GET(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const sp = new URL(req.url).searchParams

    let query = supabase
      .from('products')
      .select('*, categories(id, name), suppliers(id, name), product_variations(*), product_images(*)')
      .order('created_at', { ascending: false })

    const category = sp.get('category')
    const supplier = sp.get('supplier')
    const active = sp.get('active')
    if (category) query = query.eq('category_id', category)
    if (supplier) query = query.eq('supplier_id', supplier)
    if (active === 'true' || active === 'false') query = query.eq('is_active', active === 'true')
    if (sp.get('featured') === 'true') query = query.eq('is_featured', true)

    return NextResponse.json(check(await query, 'Erro ao buscar produtos.'))
  } catch (err) {
    return apiError(err)
  }
}

// POST /api/products
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const body = pick(await readJson(req), PRODUCT_FIELDS)
    if (!body.name) throw new HttpError(400, 'Campo obrigatório: name.')

    const data = check(
      await supabase.from('products').insert(body).select().single(),
      'Erro ao criar produto.'
    )
    return NextResponse.json({ success: true, message: 'Produto criado com sucesso.', data }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
