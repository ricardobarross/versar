import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// GET /api/produtos/[id]
// Busca produto por ID
// =====================================
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("produtos")
    .select(`
      *,
      categorias ( nome ),
      fornecedores ( nome ),
      produto_variacoes (*),
      produto_fotos (*)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

// =====================================
// PUT /api/produtos/[id]
// Atualiza produto
// =====================================
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("produtos")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
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

// =====================================
// DELETE /api/produtos/[id]
// Remove produto e suas dependências
// =====================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  // Apagar fotos
  await supabase.from("produto_fotos").delete().eq("produto_id", id);

  // Apagar variações
  await supabase.from("produto_variacoes").delete().eq("produto_id", id);

  // Apagar produto
  const { error } = await supabase.from("produtos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao apagar produto." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Produto removido com sucesso.",
  });
}
