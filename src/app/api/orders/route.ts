import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
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
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar pedidos." }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { customer_id, payment_method, notes, origin, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "O pedido deve conter ao menos 1 item." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const total = items.reduce((acc: number, item: any) => {
    return acc + Number(item.unit_price) * Number(item.quantity);
  }, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customer_id ?? null,
      payment_method: payment_method ?? null,
      notes: notes ?? null,
      origin: origin ?? "whatsapp",
      total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: "Erro ao criar pedido." }, { status: 500 });
  }

  const formattedItems = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    variation_id: item.variation_id ?? null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    created_at: new Date().toISOString(),
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(formattedItems);

  if (itemsError) {
    return NextResponse.json({ error: "Pedido criado, mas houve erro ao salvar itens." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Pedido criado com sucesso.", order_id: order.id });
}