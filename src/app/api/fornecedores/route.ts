import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// GET /api/fornecedores
// Lista todos os fornecedores
// =====================================
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar fornecedores." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// =====================================
// POST /api/fornecedores
// Cria um novo fornecedor
// =====================================
export async function POST(request: Request) {
  const body = await request.json();
  const { nome, contato, telefone, email, endereco, notas, ativo } = body;

  if (!nome) {
    return NextResponse.json(
      { error: "Campo obrigatório: nome." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("fornecedores")
    .insert({
      nome,
      contato,
      telefone,
      email,
      endereco,
      notas,
      ativo: ativo ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar fornecedor." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Fornecedor criado com sucesso.",
    data,
  });
}
