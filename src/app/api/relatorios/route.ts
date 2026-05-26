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
// GET /api/relatorios?tipo=xxxx
// Relatórios gerais do sistema
// =====================================
export async function GET(request: Request) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");

  if (!tipo) {
    return NextResponse.json(
      { error: "Informe o parâmetro ?tipo=" },
      { status: 400 }
    );
  }

  // ---------------------------
  // RELATÓRIO: vendas_totais
  // ---------------------------
  if (tipo === "vendas_totais") {
    const { data, error } = await supabase
      .from("pedidos")
      .select("total");

    if (error) {
      return NextResponse.json({ error: "Erro ao gerar relatório." }, { status: 500 });
    }

    const total = data.reduce((acc, p) => acc + Number(p.total), 0);

    return NextResponse.json({ total_vendido: total });
  }

  // ---------------------------
  // RELATÓRIO: pedidos_por_status
  // ---------------------------
  if (tipo === "pedidos_por_status") {
    const { data, error } = await supabase
      .from("pedidos")
      .select("status");

    if (error) {
      return NextResponse.json({ error: "Erro ao gerar relatório." }, { status: 500 });
    }

    const agrupado: Record<string, number> = {};

    data.forEach((p) => {
      agrupado[p.status] = (agrupado[p.status] || 0) + 1;
    });

    return NextResponse.json(agrupado);
  }

  // ---------------------------
  // RELATÓRIO: produtos_mais_vendidos
  // ---------------------------
  if (tipo === "produtos_mais_vendidos") {
    const { data, error } = await supabase
      .from("pedido_itens")
      .select("produto_id, quantidade");

    if (error) {
      return NextResponse.json({ error: "Erro ao gerar relatório." }, { status: 500 });
    }

    const ranking: Record<string, number> = {};

    data.forEach((item) => {
      ranking[item.produto_id] =
        (ranking[item.produto_id] || 0) + item.quantidade;
    });

    const ordenado = Object.entries(ranking)
      .map(([produto_id, total]) => ({ produto_id, total }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json(ordenado);
  }

  // ---------------------------
  // RELATÓRIO: faturamento_por_dia
  // ---------------------------
  if (tipo === "faturamento_por_dia") {
    const { data, error } = await supabase
      .from("pedidos")
      .select("total, created_at");

    if (error) {
      return NextResponse.json({ error: "Erro ao gerar relatório." }, { status: 500 });
    }

    const dias: Record<string, number> = {};

    data.forEach((p) => {
      const dia = p.created_at.split("T")[0];
      dias[dia] = (dias[dia] || 0) + Number(p.total);
    });

    return NextResponse.json(dias);
  }

  return NextResponse.json(
    { error: "Tipo de relatório inválido." },
    { status: 400 }
  );
}
