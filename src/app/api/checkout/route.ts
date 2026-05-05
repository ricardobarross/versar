import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { cliente: dadosCliente, itens, total } = body

    // Buscar WhatsApp da loja
    const { data: config } = await supabase
      .from('configuracoes_loja')
      .select('whatsapp')
      .single()

    const whatsappLoja = config?.whatsapp?.replace(/\D/g, '') ?? ''

    // Verificar se cliente já existe pelo WhatsApp
    let clienteId: string

    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('whatsapp', dadosCliente.whatsapp)
      .maybeSingle()

    if (clienteExistente) {
      // Actualizar dados do cliente existente
      await supabase
        .from('clientes')
        .update({
          nome: dadosCliente.nome,
          email: dadosCliente.email,
          cpf: dadosCliente.cpf,
          endereco: dadosCliente.endereco,
          cidade: dadosCliente.cidade,
          estado: dadosCliente.estado,
          cep: dadosCliente.cep,
        })
        .eq('id', clienteExistente.id)

      clienteId = clienteExistente.id
    } else {
      // Criar novo cliente
      const { data: novoCliente, error: erroCliente } = await supabase
        .from('clientes')
        .insert({
          nome: dadosCliente.nome,
          whatsapp: dadosCliente.whatsapp,
          email: dadosCliente.email,
          cpf: dadosCliente.cpf,
          endereco: dadosCliente.endereco,
          cidade: dadosCliente.cidade,
          estado: dadosCliente.estado,
          cep: dadosCliente.cep,
        })
        .select('id')
        .single()

      if (erroCliente || !novoCliente) {
        return NextResponse.json({ erro: 'Erro ao criar cliente' }, { status: 500 })
      }

      clienteId = novoCliente.id
    }

    // Criar pedido — número gerado automaticamente pela sequência do Supabase
    const { data: pedido, error: erroPedido } = await supabase
      .from('pedidos')
      .insert({
        cliente_id: clienteId,
        status: 'novo',
        total,
        forma_pagamento: 'a combinar',
        origem: 'loja_online',
      })
      .select('id, numero')
      .single()

    if (erroPedido || !pedido) {
      return NextResponse.json({ erro: 'Erro ao criar pedido' }, { status: 500 })
    }

    // Criar itens do pedido
    const pedidoItens = itens.map((item: any) => ({
      pedido_id: pedido.id,
      produto_id: item.produtoId,
      variacao_id: item.variacaoId,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
    }))

    const { error: erroItens } = await supabase
      .from('pedido_itens')
      .insert(pedidoItens)

    if (erroItens) {
      return NextResponse.json({ erro: 'Erro ao registar itens do pedido' }, { status: 500 })
    }

    return NextResponse.json({
      numero: pedido.numero,
      pedidoId: pedido.id,
      whatsapp: whatsappLoja,
    })
  } catch (e: any) {
    return NextResponse.json({ erro: e.message ?? 'Erro interno' }, { status: 500 })
  }
}