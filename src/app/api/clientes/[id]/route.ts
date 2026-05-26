import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// GET /api/clientes/[id]
// Busca cliente por ID
// =====================================
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

// =====================================
// PUT /api/clientes/[id]
// Atualiza cliente
// =====================================
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("clientes")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar cliente." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Cliente atualizado com sucesso.",
    data,
  });
}

// =====================================
// DELETE /api/clientes/[id]
// Remove cliente
// =====================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao apagar cliente." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Cliente removido com sucesso.",
  });
}
