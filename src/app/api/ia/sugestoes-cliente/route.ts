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

function diffInDays(date: string | null): number {
  if (!date) return 9999;
  const d1 = new Date(date);
  const d2 = new Date();
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const clienteId = req.nextUrl.searchParams.get("cliente_id");
    if (!clienteId) {
      return NextResponse.json(
        { success: false, error: "cliente_id é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Dados do cliente
    const clienteRes = await supabase
      .from("customers")
      .select("*")
      .eq("id", clienteId)
      .single();

    if (clienteRes.error) {
      throw new Error("Cliente não encontrado.");
    }

    const cliente = clienteRes.data;

    // Último pedido
    const lastOrderRes = await supabase
      .from("orders")
      .select("id,created_at,total")
      .eq("customer_id", clienteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const lastOrder = lastOrderRes.data || null;
    const daysWithoutPurchase = diffInDays(lastOrder?.created_at || null);

    // Produto favorito (via RPC ou fallback)
    const favRes = await supabase.rpc("customer_favorite_product", {
      customer_id_input: clienteId,
    });

    const favoriteProduct = favRes.data?.product_name || null;

    // Categoria favorita (opcional)
    const favCatRes = await supabase.rpc("customer_favorite_category", {
      customer_id_input: clienteId,
    });

    const favoriteCategory = favCatRes.data?.category_name || null;

    // Ticket médio
    const ticketRes = await supabase.rpc("customer_average_ticket", {
      customer_id_input: clienteId,
    });

    const averageTicket = ticketRes.data?.average || 0;

    // IA gera sugestão
    const meses = Math.floor(daysWithoutPurchase / 30);
    const tempoTexto =
      meses >= 1 ? `${meses} mês(es)` : `${daysWithoutPurchase} dia(s)`;

    const produtoSugestao =
      favoriteProduct || favoriteCategory || "um produto que ele costuma gostar";

    const mensagem = `Olá ${cliente.name}! Notei que faz cerca de ${tempoTexto} que você não compra conosco. ` +
      `Separei ${produtoSugestao} que acho que você vai gostar. Se quiser, posso te mandar algumas opções e condições especiais 😉`;

    return NextResponse.json(
      {
        success: true,
        cliente: {
          id: cliente.id,
          name: cliente.name,
          phone: cliente.phone,
        },
        analise: {
          days_without_purchase: daysWithoutPurchase,
          favorite_product: favoriteProduct,
          favorite_category: favoriteCategory,
          average_ticket: averageTicket,
          last_order: lastOrder,
        },
        sugestao: `Recomendo enviar uma mensagem oferecendo ${produtoSugestao}.`,
        mensagem_whatsapp: mensagem,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao gerar sugestão." },
      { status: 500 }
    );
  }
}

