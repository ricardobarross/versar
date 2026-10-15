import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/products/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories ( name ),
      suppliers ( name ),
      product_variations (*),
      product_images (*)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PUT /api/products/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("products")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar produto." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Produto atualizado com sucesso.",
    data,
  });
}

// DELETE /api/products/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  await supabase.from("product_images").delete().eq("product_id", id);
  await supabase.from("product_variations").delete().eq("product_id", id);

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao apagar produto." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Produto removido com sucesso.",
  });
}