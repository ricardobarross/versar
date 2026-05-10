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

    // Produto atual
    const { data: produto } = await supabase
      .from('produtos')
      .select(`
        id, nome, preco, preco_promocional, categoria_id,
        produto_variacoes (estoque),
        categorias (id, nome)
      `)
      .eq('id', id)
      .single()

    const estoqueTotal = (produto?.produto_variacoes as any[])?.reduce(
      (acc: number, v: any) => acc + v.estoque, 0
    ) ?? 0

    // Vendas do produto
    const { data: itensVendidos } = await supabase
      .from('pedido_itens')
      .select('quantidade, preco_unitario')
      .eq('produto_id', id)

    const totalVendido = itensVendidos?.reduce((acc, i) => acc + i.quantidade, 0) ?? 0
    const receitaTotal = itensVendidos?.reduce(
      (acc, i) => acc + i.quantidade * Number(i.preco_unitario), 0
    ) ?? 0
    const precoMedio = totalVendido > 0 ? receitaTotal / totalVendido : Number(produto?.preco ?? 0)

    // Produtos similares (mesma categoria, excluindo este)
    let produtosSimilares: { nome: string; preco: number }[] = []
    if (produto?.categoria_id) {
      const { data: similares } = await supabase
        .from('produtos')
        .select('nome, preco')
        .eq('categoria_id', produto.categoria_id)
        .eq('ativo', true)
        .neq('id', id)
        .limit(5)

      produtosSimilares = (similares ?? []).map(p => ({
        nome: p.nome,
        preco: Number(p.preco),
      }))
    }

    const precoAtual = Number(produto?.preco ?? 0)
    const margemSugerida = precoAtual * 1.3 // sugestão base +30%

    // Nível 2 — Análise com IA Anthropic
    let analiseIA = 'Sem dados suficientes para análise.'

    const contexto = `
Produto: ${produto?.nome ?? 'Desconhecido'}.
Categoria: ${(produto?.categorias as any)?.nome ?? 'Sem categoria'}.
Preço actual: R$ ${precoAtual.toFixed(2)}.
${produto?.preco_promocional ? `Preço promocional: R$ ${Number(produto.preco_promocional).toFixed(2)}.` : ''}
Estoque total: ${estoqueTotal} unidades.
Unidades vendidas: ${totalVendido}.
Receita gerada: R$ ${receitaTotal.toFixed(2)}.
Preço médio de venda: R$ ${precoMedio.toFixed(2)}.
Produtos similares na loja: ${produtosSimilares.length > 0
  ? produtosSimilares.map(p => `${p.nome} (R$ ${p.preco.toFixed(2)})`).join(', ')
  : 'nenhum na mesma categoria'}.
    `.trim()

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'És uma secretária inteligente de uma loja de moda masculina brasileira chamada VERSAR. Analisa os dados do produto e gera uma análise útil em português brasileiro, com tom profissional e direto. Máximo 3 frases. Foca no que é mais relevante para o gestor: desempenho de vendas, posicionamento de preço face a similares, alertas de estoque, e oportunidades de melhoria.',
          messages: [{ role: 'user', content: contexto }],
        }),
      })
      const data = await res.json()
      analiseIA = data.content?.[0]?.text ?? analiseIA
    } catch {}

    return NextResponse.json({
      totalVendido,
      receitaTotal,
      estoqueTotal,
      precoMedio,
      margemSugerida,
      produtosSimilares,
      analiseIA,
    })
  } catch (e: any) {
    return NextResponse.json({ erro: e.message ?? 'Erro interno' }, { status: 500 })
  }
}