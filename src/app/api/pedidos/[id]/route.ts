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
// GET /api/pedidos/[id]
// Busca um pedido com itens
// =====================================
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
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
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

// =====================================
// PUT /api/pedidos/[id]
// Atualiza dados do pedido
// =====================================
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("pedidos")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar pedido." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Pedido atualizado com sucesso.",
    data,
  });
}

// =====================================
// DELETE /api/pedidos/[id]
// Remove pedido e seus itens
// =====================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  // Apagar itens primeiro
  await supabase.from("pedido_itens").delete().eq("pedido_id", id);

  // Apagar pedido
  const { error } = await supabase.from("pedidos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao apagar pedido." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Pedido removido com sucesso.",
  });
}
