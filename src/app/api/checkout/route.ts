import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UUID_RE } from '@/lib/api'

export const dynamic = 'force-dynamic'

type ClienteIn = {
  nome?: string; whatsapp?: string; email?: string | null; cpf?: string | null
  endereco?: string; cidade?: string; estado?: string; cep?: string
}
type ItemIn = { variacaoId?: string; quantidade?: number }

const onlyDigits = (v: unknown) => String(v ?? '').replace(/\D/g, '')
const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max)

function erro(mensagem: string, status = 400) {
  return NextResponse.json({ erro: mensagem }, { status })
}

/**
 * POST /api/checkout — pedido da loja online.
 * O preço, o total e o estoque são SEMPRE calculados na base
 * (função checkout_create_order). O que vem do navegador é só
 * "que variação" e "quantas unidades".
 */
export async function POST(req: Request) {
  let body: { cliente?: ClienteIn; itens?: ItemIn[] }
  try {
    body = await req.json()
  } catch {
    return erro('Pedido inválido.')
  }

  const c = body.cliente ?? {}
  const nome = clean(c.nome, 120)
  const whatsapp = onlyDigits(c.whatsapp)
  const email = clean(c.email, 160)
  const cpf = onlyDigits(c.cpf)
  const cep = onlyDigits(c.cep)

  if (nome.length < 2) return erro('Informe seu nome.')
  if (whatsapp.length < 10 || whatsapp.length > 13) return erro('WhatsApp inválido.')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('E-mail inválido.')
  if (cpf && cpf.length !== 11) return erro('CPF inválido.')
  if (cep && cep.length !== 8) return erro('CEP inválido.')

  // junta linhas repetidas da mesma variação
  const qtd = new Map<string, number>()
  for (const it of Array.isArray(body.itens) ? body.itens : []) {
    if (!it?.variacaoId || !UUID_RE.test(it.variacaoId)) return erro('Item inválido no carrinho.')
    const q = Number(it.quantidade)
    if (!Number.isInteger(q) || q < 1) return erro('Quantidade inválida no carrinho.')
    qtd.set(it.variacaoId, (qtd.get(it.variacaoId) ?? 0) + q)
  }
  if (qtd.size === 0) return erro('O carrinho está vazio.')
  if (qtd.size > 30) return erro('Carrinho com itens demais.')

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('checkout_create_order', {
    p_customer: {
      name: nome,
      whatsapp,
      email: email || null,
      cpf: cpf || null,
      address: clean(c.endereco, 400),
      city: clean(c.cidade, 80),
      state: clean(c.estado, 2).toUpperCase(),
      zip_code: cep || null,
    },
    p_items: Array.from(qtd, ([variation_id, quantity]) => ({ variation_id, quantity })),
  })

  if (error) {
    const msg = error.message ?? ''
    const detalhe = msg.split(':').slice(2).join(':').trim()
    if (msg.includes('CHECKOUT:OUT_OF_STOCK')) {
      return erro(`Estoque insuficiente para ${detalhe}. Ajuste o carrinho e tente de novo.`, 409)
    }
    if (msg.includes('CHECKOUT:UNAVAILABLE')) {
      return erro('Um dos produtos do carrinho não está mais disponível. Atualize o carrinho.', 409)
    }
    if (msg.includes('CHECKOUT:INVALID_QUANTITY')) return erro('Quantidade inválida no carrinho.')
    console.error('[CHECKOUT]', msg)
    return erro('Não foi possível registrar o pedido. Tente novamente.', 500)
  }

  const pedido = data as {
    order_id: string
    numero: number
    total: number
    items: { name: string; variation: string; quantity: number; unit_price: number }[]
  }

  const { data: config } = await supabase.from('store_settings').select('whatsapp').maybeSingle()

  return NextResponse.json({
    pedidoId: pedido.order_id,
    numero: pedido.numero,
    total: Number(pedido.total),
    itens: pedido.items,
    whatsapp: onlyDigits(config?.whatsapp),
  })
}
