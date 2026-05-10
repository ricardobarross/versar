import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    // Nível 1 — Queries SQL

    // Pedidos do cliente
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select(`
        id, total, status, created_at,
        pedido_itens (
          quantidade,
          produtos (nome)
        )
      `)
      .eq('cliente_id', id)
      .order('created_at', { ascending: false })

    const totalPedidos = pedidos?.length ?? 0
    const totalGasto = pedidos?.reduce((acc, p) => acc + Number(p.total), 0) ?? 0

    // Último pedido
    const ultimoPedidoRaw = pedidos?.[0]
    let ultimoPedido: string | null = null
    let diasSemComprar: number | null = null

    if (ultimoPedidoRaw) {
      const data = new Date(ultimoPedidoRaw.created_at)
      ultimoPedido = data.toLocaleDateString('pt-BR')
      diasSemComprar = Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Pagamentos pendentes (pedidos novo ou confirmado)
    const pagamentosPendentes = pedidos?.filter(p =>
      p.status === 'novo' || p.status === 'confirmado'
    ).length ?? 0

    // Produtos habituais — agregar itens de todos os pedidos
    const contagemProdutos: Record<string, number> = {}
    pedidos?.forEach(pedido => {
      const itens = (pedido.pedido_itens as any[]) ?? []
      itens.forEach(item => {
        const nome = item.produtos?.nome
        if (nome) contagemProdutos[nome] = (contagemProdutos[nome] ?? 0) + item.quantidade
      })
    })

    const produtosHabituais = Object.entries(contagemProdutos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade }))

    // Nível 2 — Resumo com IA Anthropic
    let resumoIA = 'Sem dados suficientes para análise.'

    if (totalPedidos > 0) {
      const contexto = `
Cliente com ${totalPedidos} pedido(s). Total gasto: R$ ${totalGasto.toFixed(2)}.
Último pedido: ${diasSemComprar === 0 ? 'hoje' : `há ${diasSemComprar} dias`}.
Pagamentos pendentes: ${pagamentosPendentes}.
Produtos que mais compra: ${produtosHabituais.map(p => `${p.nome} (${p.quantidade}x)`).join(', ') || 'nenhum'}.
      `.trim()

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: 'És uma secretária inteligente de uma loja de moda masculina brasileira chamada VERSAR. Analisa os dados do cliente e gera um resumo útil em português brasileiro, com tom profissional mas direto. Máximo 3 frases. Destaca o que é mais relevante para o gestor da loja: fidelidade, risco de abandono, oportunidade de venda, ou ação necessária.',
            messages: [{ role: 'user', content: contexto }],
          }),
        })
        const data = await res.json()
        resumoIA = data.content?.[0]?.text ?? resumoIA
      } catch {}
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
  } catch (e: any) {
    return NextResponse.json({ erro: e.message ?? 'Erro interno' }, { status: 500 })
  }
}