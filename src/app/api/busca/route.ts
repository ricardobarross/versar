import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// GET /api/busca
// Busca avançada de produtos com filtros
// =====================================
export async function GET(request: Request) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q");
  const categoria = searchParams.get("categoria");
  const fornecedor = searchParams.get("fornecedor");
  const precoMin = searchParams.get("preco_min");
  const precoMax = searchParams.get("preco_max");
  const ativo = searchParams.get("ativo");
  const ordenar = searchParams.get("ordenar") ?? "created_at";
  const direcao = searchParams.get("direcao") ?? "desc";
  const pagina = Number(searchParams.get("pagina") ?? 1);
  const limite = Number(searchParams.get("limite") ?? 20);

  const offset = (pagina - 1) * limite;

  let query = supabase
    .from("produtos")
    .select(
      `
      *,
      categorias ( nome ),
      fornecedores ( nome ),
      produto_fotos ( url )
    `,
      { count: "exact" }
    )
    .range(offset, offset + limite - 1)
    .order(ordenar, { ascending: direcao === "asc" });

  // ---------------------------
  // Filtro: busca textual
  // ---------------------------
  if (q) {
    query = query.or(`nome.ilike.%${q}%,descricao.ilike.%${q}%`);
  }

  // ---------------------------
  // Filtro: categoria
  // ---------------------------
  if (categoria) {
    query = query.eq("categoria_id", categoria);
  }

  // ---------------------------
  // Filtro: fornecedor
  // ---------------------------
  if (fornecedor) {
    query = query.eq("fornecedor_id", fornecedor);
  }

  // ---------------------------
  // Filtro: preço mínimo
  // ---------------------------
  if (precoMin) {
    query = query.gte("preco", precoMin);
  }

  // ---------------------------
  // Filtro: preço máximo
  // ---------------------------
  if (precoMax) {
    query = query.lte("preco", precoMax);
  }

  // ---------------------------
  // Filtro: ativo
  // ---------------------------
  if (ativo === "true") query = query.eq("ativo", true);
  if (ativo === "false") query = query.eq("ativo", false);

  // ---------------------------
  // Execução final
  // ---------------------------
  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Erro ao executar busca avançada." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    pagina,
    limite,
    total: count,
    resultados: data,
  });
}

