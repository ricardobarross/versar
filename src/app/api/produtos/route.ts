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
// Lista todos os produtos (TABELAS CORRETAS)
// =====================================
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories ( name ),
      suppliers ( name )
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// =====================================
// POST /api/produtos
// Cria um novo produto (TABELA CORRETA)
// =====================================
export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, price, category_id, supplier_id, is_active } = body;

  if (!name || !price) {
    return NextResponse.json(
      { error: "Campos obrigatórios: name, price." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      description,
      price,
      category_id,
      supplier_id,
      is_active: is_active ?? true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar produto." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Produto criado com sucesso.",
    data,
  });
}
