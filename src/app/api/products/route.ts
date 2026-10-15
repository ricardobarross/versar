import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/products
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const supplier = searchParams.get("supplier");
  const active = searchParams.get("active");
  const featured = searchParams.get("featured");

  const supabase = supabaseServer();

  let query = supabase
    .from("products")
    .select(`
      *,
      categories ( id, name ),
      suppliers ( id, name ),
      product_variations (*),
      product_images (*)
    `)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category_id", category);
  if (supplier) query = query.eq("supplier_id", supplier);
  if (active !== null && active !== undefined) query = query.eq("is_active", active === "true");
  if (featured === "true") query = query.eq("is_featured", true);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar produtos." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/products
export async function POST(request: Request) {
  const body = await request.json();

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("products")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar produto." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Produto criado com sucesso.",
    data,
  });
}