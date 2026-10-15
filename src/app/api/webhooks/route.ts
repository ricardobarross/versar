import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UUID_RE } from '@/lib/api'
import type { OrderStatus } from '@/lib/orders'

export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks — eventos externos (pagamentos, envio, WhatsApp).
 *
 * Segurança: o remetente tem de assinar o corpo bruto com HMAC-SHA256
 * usando WEBHOOK_SECRET e enviar o resultado (hex) no cabeçalho
 * `x-webhook-signature`. Sem WEBHOOK_SECRET configurado a rota fica desligada.
 *
 * Corpo: { "tipo": "pagamento_aprovado" | "pagamento_cancelado" | "pedido_enviado"
 *          | "mensagem_whatsapp", "pedido_id"?: uuid, "numero"?: string, "mensagem"?: string }
 */
const STATUS_POR_EVENTO: Record<string, OrderStatus> = {
  pagamento_aprovado: 'paid',
  pagamento_cancelado: 'canceled',
  pedido_enviado: 'shipped',
}

function assinaturaValida(raw: string, recebida: string | null, segredo: string) {
  if (!recebida) return false
  const esperada = createHmac('sha256', segredo).update(raw).digest('hex')
  const a = Buffer.from(esperada, 'utf8')
  const b = Buffer.from(recebida.replace(/^sha256=/, ''), 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  const segredo = process.env.WEBHOOK_SECRET
  if (!segredo) {
    return NextResponse.json({ error: 'Webhooks desativados (WEBHOOK_SECRET não configurado).' }, { status: 503 })
  }

  const raw = await req.text()
  if (!assinaturaValida(raw, req.headers.get('x-webhook-signature'), segredo)) {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })
  }

  let body: { tipo?: string; pedido_id?: string; numero?: string; mensagem?: string }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const tipo = typeof body.tipo === 'string' ? body.tipo : 'desconhecido'
  const supabase = createAdminClient()

  const { data: log, error: logError } = await supabase
    .from('webhook_logs')
    .insert({ tipo, payload: body, processado: false })
    .select('id')
    .single()
  if (logError) return NextResponse.json({ error: 'Erro ao registar webhook.' }, { status: 500 })

  try {
    const novoStatus = STATUS_POR_EVENTO[tipo]
    if (novoStatus) {
      if (!body.pedido_id || !UUID_RE.test(body.pedido_id)) throw new Error('pedido_id inválido')
      const { error } = await supabase.from('orders').update({ status: novoStatus }).eq('id', body.pedido_id)
      if (error) throw new Error(error.message)
    } else if (tipo === 'mensagem_whatsapp') {
      const { error } = await supabase.from('mensagens_whatsapp').insert({
        numero: String(body.numero ?? '').slice(0, 30),
        mensagem: String(body.mensagem ?? '').slice(0, 4000),
      })
      if (error) throw new Error(error.message)
    }
    // outros tipos ficam só registados no log

    await supabase.from('webhook_logs').update({ processado: true }).eq('id', log.id)
    return NextResponse.json({ success: true })
  } catch (e) {
    await supabase.from('webhook_logs').update({ erro: String(e) }).eq('id', log.id)
    return NextResponse.json({ error: 'Erro ao processar webhook.' }, { status: 500 })
  }
}
