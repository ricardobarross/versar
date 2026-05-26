
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/app/api/admin/auth/route";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Configuração do Supabase ausente.");
  return { url, anonKey };
}

function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const supabase = createSupabaseServerClient();
    const url = req.nextUrl;

    // Filtros
    const dataInicio = url.searchParams.get("data_inicio");
    const dataFim = url.searchParams.get("data_fim");
    const clienteId = url.searchParams.get("cliente_id");
    const produtoId = url.searchParams.get("produto_id");
    const categoriaId = url.searchParams.get("categoria_id");
    const status = url.searchParams.get("status");
    const origem = url.searchParams.get("origem");
    const vendedorId = url.searchParams.get("vendedor_id");
    const ticketMin = url.searchParams.get("ticket_min");
    const ticketMax = url.searchParams.get("ticket_max");

    let query = supabase
      .from("orders")
      .select(
        `
        id,
        customer_id,
        total,
        status,
        origem,
        created_at,
        items:order_items (
          product_id,
          quantity,
          price,
          product:products (
            name,
            category_id
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    // Aplicando filtros dinamicamente
    if (dataInicio) query.gte("created_at", dataInicio);
    if (dataFim) query.lte("created_at", dataFim);
    if (clienteId) query.eq("customer_id", clienteId);
    if (status) query.eq("status", status);
    if (origem) query.eq("origem", origem);
    if (vendedorId) query.eq("vendedor_id", vendedorId);
    if (ticketMin) query.gte("total", Number(ticketMin));
    if (ticketMax) query.lte("total", Number(ticketMax));

    const { data: pedidos, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Filtro por produto
    let pedidosFiltrados = pedidos;
    if (produtoId) {
      pedidosFiltrados = pedidos.filter((p: any) =>
        p.items.some((i: any) => i.product_id === produtoId)
      );
    }

    // Filtro por categoria
    if (categoriaId) {
      pedidosFiltrados = pedidosFiltrados.filter((p: any) =>
        p.items.some((i: any) => i.product.category_id === categoriaId)
      );
    }

    // Resumo
    const totalPedidos = pedidosFiltrados.length;
    const totalVendido = pedidosFiltrados.reduce(
      (acc: number, p: any) => acc + p.total,
      0
    );

    const ticketMedio = totalPedidos > 0 ? totalVendido / totalPedidos : 0;

    return NextResponse.json(
      {
        success: true,
        filtros: {
          dataInicio,
          dataFim,
          clienteId,
          produtoId,
          categoriaId,
          status,
          origem,
          vendedorId,
          ticketMin,
          ticketMax,
        },
        resumo: {
          totalPedidos,
          totalVendido,
          ticketMedio,
        },
        pedidos: pedidosFiltrados,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao gerar relatório." },
      { status: 500 }
    );
  }
}
