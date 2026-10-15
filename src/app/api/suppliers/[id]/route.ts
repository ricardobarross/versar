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
    .from("suppliers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("suppliers")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar fornecedor." }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Erro ao apagar fornecedor." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}