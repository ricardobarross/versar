import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");

  const supabase = supabaseServer();

  let query = supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });

  if (active !== null) query = query.eq("is_active", active === "true");

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar clientes." }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("customers")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}