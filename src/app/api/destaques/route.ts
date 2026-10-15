import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("destaques")
    .select(`
      *,
      products (
        name,
        price,
        is_active
      )
    `)
    .order("ordem", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar destaques." }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { product_id, ordem, ativo } = body;

  if (!product_id) {
    return NextResponse.json({ error: "Campo obrigatório: product_id." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("destaques")
    .insert({
      product_id,
      ordem: ordem ?? 0,
      ativo: ativo ?? true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar destaque." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Destaque criado com sucesso.", data });
}