import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cria cliente Supabase (server-side)
function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/*
  OPERACOES SUPORTADAS:

  { "operacao": "add", "valor": 5 }     → soma 5 ao estoque
  { "operacao": "add", "valor": -3 }    → subtrai 3 do estoque
  { "operacao": "set", "valor": 20 }    → define estoque = 20
*/

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // Validar ID
  if (!id || id.length < 10) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { operacao, valor } = body;

  // Validar corpo
  if (!operacao || valor === undefined) {
    return NextResponse.json(
      { error: "Envie { operacao: 'add' | 'set', valor: number }" },
      { status: 400 }
    );
  }

  if (typeof valor !== "number") {
    return NextResponse.json({ error: "O valor deve ser numérico." }, { status: 400 });
  }

  if (!["add", "set"].includes(operacao)) {
    return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
  }

  const supabase = supabaseServer();

  // 1. Buscar variação atual
  const { data: variacao, error: fetchError } = await supabase
    .from("produto_variacoes")
    .select("estoque")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: "Erro ao buscar variação." }, { status: 500 });
  }

  if (!variacao) {
    return NextResponse.json({ error: "Variação não encontrada." }, { status: 404 });
  }

  let novoEstoque = variacao.estoque;

  // 2. Calcular novo estoque
  if (operacao === "add") {
    novoEstoque = variacao.estoque + valor;
  } else if (operacao === "set") {
    novoEstoque = valor;
  }

  // 3. Impedir estoque negativo
  if (novoEstoque < 0) {
    return NextResponse.json(
      { error: "O estoque não pode ficar negativo." },
      { status: 400 }
    );
  }

  // 4. Atualizar no Supabase
  const { data, error: updateError } = await supabase
    .from("produto_variacoes")
    .update({
      estoque: novoEstoque,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Erro ao atualizar estoque." }, { status: 500 });
  }

  // 5. Retornar resultado
  return NextResponse.json({
    success: true,
    message: "Estoque atualizado com sucesso.",
    data,
  });
}
