import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const { email, senha } = await request.json();

  if (!email || !senha) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data: admin, error } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !admin) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const senhaValida = await bcrypt.compare(senha, admin.senha_hash);

  if (!senhaValida) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  const response = NextResponse.json({
    success: true,
    message: "Login realizado com sucesso.",
  });

  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
