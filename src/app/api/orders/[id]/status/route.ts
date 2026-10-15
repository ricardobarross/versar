import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const VALID_STATUS = ["novo", "pago", "enviado", "cancelado", "concluido"];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ status: data.status });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { status } = await request.json();

  if (!status) {
    return NextResponse.json({ error: "Campo obrigatório: status." }, { status: 400 });
  }

  if (!VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: `Status inválido. Permitidos: ${VALID_STATUS.join(", ")}` }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar status." }, { status: 500