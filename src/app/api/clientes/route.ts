import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// GET /api/clientes
// Lista todos os clientes
// =====================================
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar clientes." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// =====================================
// POST /api/clientes
// Cria um novo cliente
// =====================================
export async function POST(request: Request) {
  const body = await request.json();
  const { nome, whatsapp, email, cpf, endereco, cidade, estado, cep, notas } = body;

  if (!nome) {
    return NextResponse.json(
      { error: "Campo obrigatório: nome." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nome,
      whatsapp,
      email,
      cpf,
      endereco,
      cidade,
      estado,
      cep,
      notas,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Cliente criado com sucesso.",
    data,
  });
}
