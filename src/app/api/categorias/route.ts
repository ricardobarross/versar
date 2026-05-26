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
// GET /api/categorias
// Lista todas as categorias
// =====================================
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar categorias." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// =====================================
// POST /api/categorias
// Cria uma nova categoria
// =====================================
export async function POST(request: Request) {
  const body = await request.json();
  const { nome, slug, ativo } = body;

  // Validar campos obrigatórios
  if (!nome || !slug) {
    return NextResponse.json(
      { error: "Campos obrigatórios: nome, slug." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("categorias")
    .insert({
      nome,
      slug,
      ativo: ativo ?? true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Categoria criada com sucesso.",
    data,
  });
}
