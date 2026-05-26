import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// GET /api/produtos
// Lista todos os produtos
// =====================================
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("produtos")
    .select(`
      *,
      categorias ( nome ),
      fornecedores ( nome )
    `)
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar produtos." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// =====================================
// POST /api/produtos
// Cria um novo produto
// =====================================
export async function POST(request: Request) {
  const body = await request.json();
  const { nome, descricao, preco, categoria_id, fornecedor_id, ativo } = body;

  if (!nome || !preco) {
    return NextResponse.json(
      { error: "Campos obrigatórios: nome, preco." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("produtos")
    .insert({
      nome,
      descricao,
      preco,
      categoria_id,
      fornecedor_id,
      ativo: ativo ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar produto." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Produto criado com sucesso.",
    data,
  });
}
