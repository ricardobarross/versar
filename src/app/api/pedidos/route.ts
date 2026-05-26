import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cria cliente Supabase (server-side)
function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// GET /api/pedidos
// Lista todos os pedidos com itens
// =====================================
export async function GET() {
  const supabase = supabaseServer();

  const { data: pedidos, error } = await supabase
    .from("pedidos")
    .select(`
      *,
      pedido_itens (
        id,
        produto_id,
        variacao_id,
        quantidade,
        preco_unitario
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar pedidos." }, { status: 500 });
  }

  return NextResponse.json(pedidos);
}

// =====================================
// POST /api/pedidos
// Cria um novo pedido com itens
// =====================================
export async function POST(request: Request) {
  const body = await request.json();
  const {
    cliente_id,
    forma_pagamento,
    observacoes,
    origem,
    itens, // array de itens
  } = body;

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json(
      { error: "O pedido deve conter ao menos 1 item." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  // 1. Calcular total
  const total = itens.reduce((acc, item) => {
    return acc + Number(item.preco_unitario) * Number(item.quantidade);
  }, 0);

  // 2. Criar pedido
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: cliente_id ?? null,
      forma_pagamento: forma_pagamento ?? null,
      observacoes: observacoes ?? null,
      origem: origem ?? "whatsapp",
      total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (pedidoError) {
    return NextResponse.json({ error: "Erro ao criar pedido." }, { status: 500 });
  }

  // 3. Criar itens do pedido
  const itensFormatados = itens.map((item: any) => ({
    pedido_id: pedido.id,
    produto_id: item.produto_id,
    variacao_id: item.variacao_id ?? null,
    quantidade: item.quantidade,
    preco_unitario: item.preco_unitario,
    created_at: new Date().toISOString(),
  }));

  const { error: itensError } = await supabase
    .from("pedido_itens")
    .insert(itensFormatados);

  if (itensError) {
    return NextResponse.json(
      { error: "Pedido criado, mas houve erro ao salvar itens." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Pedido criado com sucesso.",
    pedido_id: pedido.id,
  });
}
