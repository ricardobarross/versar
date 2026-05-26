import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/app/api/admin/auth/route";

type InventoryMovement = {
  id: string;
  product_id: string;
  variation_id: string | null;
  type: "in" | "out" | "adjust";
  quantity: number;
  note: string | null;
  created_at: string;
};

type InventoryBalance = {
  product_id: string;
  variation_id: string | null;
  total: number;
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Configuração do Supabase ausente.");
  }

  return { url, anonKey };
}

function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * GET → listar movimentações ou saldo
 * /api/inventory?product_id=...&variation_id=...
 * /api/inventory?balance=true
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const productId = req.nextUrl.searchParams.get("product_id");
    const variationId = req.nextUrl.searchParams.get("variation_id");
    const balance = req.nextUrl.searchParams.get("balance") === "true";

    const supabase = createSupabaseServerClient();

    if (balance) {
      const { data, error } = await supabase.rpc("inventory_balance");

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, balance: data as InventoryBalance[] },
        { status: 200 }
      );
    }

    const query = supabase.from("inventory_movements").select("*");

    if (productId) query.eq("product_id", productId);
    if (variationId) query.eq("variation_id", variationId);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, movements: data as InventoryMovement[] },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao consultar estoque.",
      },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST → registrar movimentação
 * Campos obrigatórios:
 * - product_id
 * - type: "in" | "out" | "adjust"
 * - quantity
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { product_id, variation_id, type, quantity, note } = body;

    if (!product_id || !type || typeof quantity !== "number") {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: product_id, type, quantity.",
        },
        { status: 400 }
      );
    }

    if (!["in", "out", "adjust"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Tipo inválido de movimentação." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("inventory_movements")
      .insert({
        product_id,
        variation_id: variation_id || null,
        type,
        quantity,
        note: note || null,
      })
      .select("*")
      .single<InventoryMovement>();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, movement: data },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao registrar movimentação.",
      },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE → remover movimentação específica
 */
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID da movimentação é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("inventory_movements")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Movimentação removida." },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao remover movimentação.",
      },
      { status: error.status || 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Token",
      },
    }
  );
}

