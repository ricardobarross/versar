import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/app/api/admin/auth/route";

type ProductVariation = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number | null;
  stock: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const productId = req.nextUrl.searchParams.get("product_id");

    const supabase = createSupabaseServerClient();

    const query = supabase.from("product_variations").select("*");

    if (productId) {
      query.eq("product_id", productId);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, variations: data as ProductVariation[] },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao listar variações.",
      },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { product_id, name, sku, price, stock, is_active } = body;

    if (!product_id || !name) {
      return NextResponse.json(
        { success: false, error: "
