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
// GET /api/produtos/[id]/variacoes
// Lista todas as variações de um produto
// =====================================
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || id.length < 10) {
    return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("produto_variacoes")
    .select("*")
    .eq("produto_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar variações." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// =====================================
// POST /api/produtos/[id]/variacoes
// Cria uma nova variação para o produto
// =====================================
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || id.length < 10) {
    return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { cor, tamanho, estoque } = body;

  // Validar campos obrigatórios
  if (!cor || !tamanho) {
    return NextResponse.json(
      { error: "Campos obrigatórios: cor, tamanho." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("produto_variacoes")
    .insert({
      produto_id: id,
      cor,
      tamanho,
      estoque: estoque ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar variação." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Variação criada com sucesso.",
    data,
  });
}
