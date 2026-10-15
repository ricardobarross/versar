
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireAdmin(req);

    const [orders, customers, products] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json(
      {
        success: true,
        metrics: {
          total_orders: orders.count ?? 0,
          total_customers: customers.count ?? 0,
          total_products: products.count ?? 0,
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

