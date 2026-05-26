
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

    const [orders, customers, products] = await Promise.all([
      supabase.from("orders").select("id"),
      supabase.from("customers").select("id"),
      supabase.from("products").select("id"),
    ]);

    return NextResponse.json(
      {
        success: true,
        metrics: {
          total_orders: orders.data?.length || 0,
          total_customers: customers.data?.length || 0,
          total_products: products.data?.length || 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao carregar dashboard." },
      { status: error.status || 500 }
    );
  }
}

