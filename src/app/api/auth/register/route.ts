import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const { nome, email, senha } = await request.json();

  if (!nome || !email || !senha) {
    return NextResponse.json(
      { error: "Nome, email e senha são obrigatórios." },
      { status: 400 }
    );
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("admins")
    .insert({
      nome,
      email,
      senha_hash,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar admin." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Admin criado com sucesso.",
    data,
  });
}
