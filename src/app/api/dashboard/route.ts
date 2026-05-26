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
// GET /api/dashboard
// Dados gerais para o painel administrativo
// =====================================
export async function GET() {
  const supabase = supabaseServer();

  // ---------------------------
  // Total de pedidos
  // ---------------------------
  const { count: totalPedidos } = await supabase
    .from("pedidos")
    .select("*", { count: "exact", head: true });

  // ---------------------------
  // Total de vendas
  // ---------------------------
  const { data: vendas } = await supabase
    .from("pedidos")
    .select("total");

  const totalVendas = vendas?.reduce((acc, p) => acc + Number(p.total), 0) ?? 0;

  // ---------------------------
  // Total de clientes
  // ---------------------------
  const { count: totalClientes } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  // ---------------------------
  // Pedidos por status
  // ---------------------------
  const { data: pedidosStatus } = await supabase
    .from("pedidos")
    .select("status");

  const statusAgrupado: Record<string, number> = {};
  pedidosStatus?.forEach((p) => {
    statusAgrupado[p.status] = (statusAgrupado[p.status] || 0) + 1;
  });

  // ---------------------------
  // Faturamento últimos 7 dias
  // ---------------------------
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const { data: ultimosPedidos } = await supabase
    .from("pedidos")
    .select("total, created_at")
    .gte("created_at", seteDiasAtras.toISOString());

  const faturamentoDias: Record<string, number> = {};
  ultimosPedidos?.forEach((p) => {
    const dia = p.created_at.split("T")[0];
    faturamentoDias[dia] = (faturamentoDias[dia] || 0) + Number(p.total);
  });

  // ---------------------------
  // Top 5 produtos mais vendidos
  // ---------------------------
  const { data: itens } = await supabase
    .from("pedido_itens")
    .select("produto_id, quantidade");

  const ranking: Record<string, number> = {};
  itens?.forEach((item) => {
    ranking[item.produto_id] =
      (ranking[item.produto_id] || 0) + item.quantidade;
  });

  const topProdutos = Object.entries(ranking)
    .map(([produto_id, total]) => ({ produto_id, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // ---------------------------
  // Retorno final
  // ---------------------------
  return NextResponse.json({
    totalPedidos,
    totalVendas,
    totalClientes,
    pedidosPorStatus: statusAgrupado,
    faturamentoUltimos7Dias: faturamentoDias,
    topProdutos,
  });
}
