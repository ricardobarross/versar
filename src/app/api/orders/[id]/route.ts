import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_id,
        variation_id,
        quantity,
        unit_price
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("orders")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar pedido." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Pedido atualizado com sucesso.", data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  await supabase.from("order_items").delete().eq("order_id", params.id);

  const { error } = await supabase.from("orders").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Erro ao apagar pedido." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Pedido removido com sucesso." });
}