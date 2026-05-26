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
// POST /api/produtos/[id]/toggle
// Alterna ativo e destaque ao mesmo tempo
// =====================================
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // Validar ID
  if (!id || id.length < 10) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const supabase = supabaseServer();

  // 1. Buscar produto atual
  const { data: produto, error: fetchError } = await supabase
    .from("produtos")
    .select("ativo, destaque")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: "Erro ao buscar produto." }, { status: 500 });
  }

  if (!produto) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  // 2. Alternar os valores
  const novoAtivo = !produto.ativo;
  const novoDestaque = !produto.destaque;

  // 3. Atualizar no Supabase
  const { data, error: updateError } = await supabase
    .from("produtos")
    .update({
      ativo: novoAtivo,
      destaque: novoDestaque,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Erro ao alternar estado do produto." }, { status: 500 });
  }

  // 4. Retornar produto atualizado
  return NextResponse.json({
    success: true,
    message: "Produto atualizado com sucesso.",
    data,
  });
}
