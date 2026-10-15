import { NextResponse } from 'next/server'
import { requireAdmin, apiError, assertUuid } from '@/lib/api'
import { askClaude } from '@/lib/ai'
import { OPEN_ORDER_STATUSES, type OrderStatus } from '@/lib/orders'

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params
  try {
    const { id } = params
    assertUuid(id)
    const { supabase } = await requireAdmin(request)

    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id, total, status, created_at,
        order_items (
          quantity,
          products (name)
        )
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    const totalPedidos = orders?.length ?? 0
    const totalGasto = orders?.reduce((acc, p) => acc + Number(p.total), 0) ?? 0

    const ultimoOrderRaw = orders?.[0]
    let ultimoPedido: string | null = null
    let diasSemComprar: number | null = null

    if (ultimoOrderRaw) {
      const data = new Date(ultimoOrderRaw.created_at)
      ultimoPedido = data.toLocaleDateString('pt-BR')
      diasSemComprar = Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Pedidos ainda em aberto (novos/confirmados/pagos/em separação)
    const pagamentosPendentes = orders?.filter(p =>
      OPEN_ORDER_STATUSES.includes(p.status as OrderStatus)
    ).length ?? 0

    const contagemProdutos: Record<string, number> = {}
    orders?.forEach(order => {
      const itens = (order.order_items as any[]) ?? []
      itens.forEach(item => {
        const nome = item.products?.name
        if (nome) contagemProdutos[nome] = (contagemProdutos[nome] ?? 0) + item.quantity
      })
    })

    const produtosHabituais = Object.entries(contagemProdutos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade }))

    let resumoIA = ''

    if (totalPedidos > 0) {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (apiKey) {
        const contexto = `
Cliente com ${totalPedidos} pedido(s). Total gasto: R$ ${totalGasto.toFixed(2)}.
Último pedido: ${diasSemComprar === 0 ? 'hoje' : `há ${diasSemComprar} dias`}.
Pagamentos pendentes: ${pagamentosPendentes}.
Produtos que mais compra: ${produtosHabituais.map(p => `${p.nome} (${p.quantidade}x)`).join(', ') || 'nenhum'}.
        `.trim()

        resumoIA = (await askClaude(
          'És uma secretária inteligente de uma loja de moda masculina brasileira chamada VERSAR. Analisa os dados do cliente e gera um resumo útil em português brasileiro, com tom profissional mas direto. Máximo 3 frases. Destaca o que é mais relevante para o gestor da loja: fidelidade, risco de abandono, oportunidade de venda, ou ação necessária.',
          contexto
        )) ?? ''
      }

      if (!resumoIA) {
        const produtoMaisComprado = produtosHabituais[0]?.nome ?? 'peças básicas'
        if (pagamentosPendentes > 0) {
          resumoIA = `Cliente frequente com R$ ${totalGasto.toFixed(2)} gastos na loja, mas possui atualmente ${pagamentosPendentes} pagamento(s) pendente(s). Recomenda-se um contato direto via WhatsApp para regularizar a situação financeira e liberar novos pedidos. Seu produto preferido é ${produtoMaisComprado}.`
        } else if (diasSemComprar !== null && diasSemComprar > 180) {
          resumoIA = `Atenção: este cliente está inativo há ${diasSemComprar} dias, apresentando alto risco de evasão. Uma boa ação corretiva é enviar um cupom de desconto personalizado via WhatsApp com foco em ${produtoMaisComprado}, que costuma ser sua principal escolha.`
        } else if (totalPedidos >= 3 && totalGasto > 500) {
          resumoIA = `Cliente VIP altamente fiel com ${totalPedidos} pedidos finalizados e excelente ticket médio. Foco total em relacionamento e pós-venda premium. Apresentar os lançamentos da nova coleção em primeira mão pode gerar novas conversões de alta margem.`
        } else {
          resumoIA = `Cliente recente com comportamento de compra positivo e sem pendências financeiras. Demonstra preferência por itens como ${produtoMaisComprado}. Sugere-se acompanhar o pós-venda da última compra para garantir a fidelização.`
        }
      }
    } else {
      resumoIA = 'Sem dados suficientes para análise.'
    }

    return NextResponse.json({
      totalPedidos,
      totalGasto,
      ultimoPedido,
      diasSemComprar,
      produtosHabituais,
      pagamentosPendentes,
      resumoIA,
    })
  } catch (err) {
    return apiError(err)
  }
}