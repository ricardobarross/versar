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
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar fornecedores." }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("suppliers")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar fornecedor." }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}