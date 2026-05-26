import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// GET /api/destaques
// Lista todos os destaques com dados do produto
// =====================================
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("destaques")
    .select(`
      *,
      produtos (
        nome,
        preco,
        ativo
      )
    `)
    .order("ordem", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar destaques." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// =====================================
// POST /api/destaques
// Cria um novo destaque
// =====================================
export async function POST(request: Request) {
  const body = await request.json();
  const { produto_id, ordem, ativo } = body;

  if (!produto_id) {
    return NextResponse.json(
      { error: "Campo obrigatório: produto_id." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("destaques")
    .insert({
      produto_id,
      ordem: ordem ?? 0,
      ativo: ativo ?? true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar destaque." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Destaque criado com sucesso.",
    data,
  });
}
