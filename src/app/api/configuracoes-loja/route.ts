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
// GET /api/configuracoes-loja
// Retorna a configuração única da loja
// =====================================
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("configuracoes_loja")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Erro ao buscar configurações da loja." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// =====================================
// PUT /api/configuracoes-loja
// Atualiza a configuração única da loja
// =====================================
export async function PUT(request: Request) {
  const body = await request.json();

  const supabase = supabaseServer();

  // Buscar ID da configuração existente
  const { data: existente, error: fetchError } = await supabase
    .from("configuracoes_loja")
    .select("id")
    .limit(1)
    .single();

  if (fetchError || !existente) {
    return NextResponse.json(
      { error: "Configuração da loja não encontrada." },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("configuracoes_loja")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existente.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar configurações da loja." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Configurações atualizadas com sucesso.",
    data,
  });
}
