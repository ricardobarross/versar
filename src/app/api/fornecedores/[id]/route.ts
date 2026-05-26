import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// GET /api/fornecedores/[id]
// Busca fornecedor por ID
// =====================================
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

// =====================================
// PUT /api/fornecedores/[id]
// Atualiza fornecedor
// =====================================
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("fornecedores")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar fornecedor." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Fornecedor atualizado com sucesso.",
    data,
  });
}

// =====================================
// DELETE /api/fornecedores/[id]
// Remove fornecedor
// =====================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  const { error } = await supabase
    .from("fornecedores")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao apagar fornecedor." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Fornecedor removido com sucesso.",
  });
}
