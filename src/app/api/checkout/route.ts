import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Corre só no servidor: usa a service role porque o RLS não deixa
    // visitantes lerem/criarem clientes e pedidos diretamente.
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const body = await request.json()
    const { cliente: dadosCliente, itens, total } = body

    const { data: config } = await supabase
      .from('store_settings')
      .select('whatsapp')
      .maybeSingle()

    const whatsappLoja = config?.whatsapp?.replace(/\D/g, '') ?? ''

    let clienteId: string

    const { data: clienteExistente } = await supabase
      .from('customers')
      .select('id')
      .eq('whatsapp', dadosCliente.whatsapp)
      .maybeSingle()

    if (clienteExistente) {
      await supabase
        .from('customers')
        .update({
          name: dadosCliente.nome,
          email: dadosCliente.email,
          cpf: dadosCliente.cpf,
          address: dadosCliente.endereco,
          city: dadosCliente.cidade,
          state: dadosCliente.estado,
          zip_code: dadosCliente.cep,
        })
        .eq('id', clienteExistente.id)

      clienteId = clienteExistente.id
    } else {
      const { data: novoCliente, error: erroCliente } = await supabase
        .from('customers')
        .insert({
          name: dadosCliente.nome,
          whatsapp: dadosCliente.whatsapp,
          email: dadosCliente.email,
          cpf: dadosCliente.cpf,
          address: dadosCliente.endereco,
          city: dadosCliente.cidade,
          state: dadosCliente.estado,
          zip_code: dadosCliente.cep,
        })
        .select('id')
        .single()

      if (erroCliente || !novoCliente) {
        return NextResponse.json({ erro: 'Erro ao criar cliente' }, { status: 500 })
      }

      clienteId = novoCliente.id
    }

    const { data: order, error: erroOrder } = await supabase
      .from('orders')
      .insert({
        customer_id: clienteId,
        status: 'novo',
        total,
        payment_method: 'a combinar',
        origin: 'loja_online',
      })
      .select('id, numero')
      .single()

    if (erroOrder || !order) {
      return NextResponse.json({ erro: 'Erro ao criar pedido' }, { status: 500 })
    }

    const orderItems = itens.map((item: any) => ({
      order_id: order.id,
      product_id: item.produtoId,
      variation_id: item.variacaoId,
      quantity: item.quantidade,
      unit_price: item.precoUnitario,
    }))

    const { error: erroItens } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (erroItens) {
      return NextResponse.json({ erro: 'Erro ao registar itens do pedido' }, { status: 500 })
    }

    return NextResponse.json({
      numero: order.numero,
      pedidoId: order.id,
      whatsapp: whatsappLoja,
    })
  } catch (e: any) {
    return NextResponse.json({ erro: e.message ?? 'Erro interno' }, { status: 500 })
  }
}