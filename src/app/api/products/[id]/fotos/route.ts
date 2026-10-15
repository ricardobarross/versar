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
// GET /api/produtos/[id]/fotos
// Lista todas as fotos de um produto
// =====================================
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || id.length < 10) {
    return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("produto_fotos")
    .select("*")
    .eq("produto_id", id)
    .order("ordem", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar fotos." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// =====================================
// POST /api/produtos/[id]/fotos
// Cria uma nova foto para o produto
// =====================================
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || id.length < 10) {
    return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { url, ordem } = body;

  if (!url) {
    return NextResponse.json(
      { error: "Campo obrigatório: url." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("produto_fotos")
    .insert({
      produto_id: id,
      url,
      ordem: ordem ?? 0,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar foto." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Foto adicionada com sucesso.",
    data,
  });
}
