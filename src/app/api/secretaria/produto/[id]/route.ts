import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: product } = await supabase
      .from('products')
      .select(`
        id, name, price, promo_price, category_id,
        product_variations (stock),
        categories (id, name)
      `)
      .eq('id', id)
      .single()

    const estoqueTotal = (product?.product_variations as any[])?.reduce(
      (acc: number, v: any) => acc + v.stock, 0
    ) ?? 0

    const { data: itensVendidos } = await supabase
      .from('order_items')
      .select('quantity, unit_price')
      .eq('product_id', id)

    const totalVendido = itensVendidos?.reduce((acc, i) => acc + i.quantity, 0) ?? 0
    const receitaTotal = itensVendidos?.reduce(
      (acc, i) => acc + i.quantity * Number(i.unit_price), 0
    ) ?? 0
    const precoMedio = totalVendido > 0 ? receitaTotal / totalVendido : Number(product?.price ?? 0)

    let produtosSimilares: { nome: string; preco: number }[] = []
    if (product?.category_id) {
      const { data: similares } = await supabase
        .from('products')
        .select('name, price')
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', id)
        .limit(5)

      produtosSimilares = (similares ?? []).map(p => ({
        nome: p.name,
        preco: Number(p.price),
      }))
    }

    const precoAtual = Number(product?.price ?? 0)
    const margemSugerida = precoAtual * 1.3

    let analiseIA = ''

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      const contexto = `
Produto: ${product?.name ?? 'Desconhecido'}.
Categoria: ${(product?.categories as any)?.name ?? 'Sem categoria'}.
Preço actual: R$ ${precoAtual.toFixed(2)}.
${product?.promo_price ? `Preço promocional: R$ ${Number(product.promo_price).toFixed(2)}.` : ''}
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
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: 'És uma secretária inteligente de uma loja de moda masculina brasileira chamada VERSAR. Analisa os dados do produto e gera uma análise útil em português brasileiro, com tom profissional e direto. Máximo 3 frases. Foca no que é mais relevante para o gestor: desempenho de vendas, posicionamento de preço face a similares, alertas de estoque, e oportunidades de melhoria.',
            messages: [{ role: 'user', content: contexto }],
          }),
        })
        const data = await res.json()
        analiseIA = data.content?.[0]?.text ?? ''
      } catch {}
    }

    if (!analiseIA) {
      if (estoqueTotal <= 5 && totalVendido > 0) {
        analiseIA = `Alerta de estoque crítico: restam apenas ${estoqueTotal} unidades deste produto, que possui bom histórico de vendas (gerou R$ ${receitaTotal.toFixed(2)} em receita). Recomendado acionar o fornecedor imediatamente para reposição da grade. O posicionamento de preço atual de R$ ${precoAtual.toFixed(2)} está equilibrado.`
      } else if (totalVendido === 0) {
        analiseIA = `Este produto ainda não registrou vendas no sistema. Recomenda-se aumentar sua exposição na vitrine principal da loja ou avaliar uma ação promocional inicial, uma vez que o preço sugerido é R$ ${precoAtual.toFixed(2)}.`
      } else if (produtosSimilares.length > 0 && precoAtual > Math.max(...produtosSimilares.map(p => p.preco))) {
        analiseIA = `Produto posicionado em faixa premium na categoria, com preço acima dos concorrentes diretos (similares custam em média menos que R$ ${precoAtual.toFixed(2)}). A estratégia de marketing deve focar em destacar o tecido e acabamento superior para justificar o preço. Vendeu ${totalVendido} unidades até o momento.`
      } else {
        analiseIA = `Desempenho estável com receita acumulada de R$ ${receitaTotal.toFixed(2)} e estoque saudável com ${estoqueTotal} unidades. O posicionamento de preço em R$ ${precoAtual.toFixed(2)} está competitivo em relação aos produtos similares da categoria.`
      }
    }

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