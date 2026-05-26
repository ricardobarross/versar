import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// POST /api/upload
// Upload de imagens para o Supabase Storage
// =====================================
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "Nenhum arquivo enviado." },
      { status: 400 }
    );
  }

  const extensao = file.name.split(".").pop();
  const nomeArquivo = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${extensao}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload para o bucket "uploads"
  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(nomeArquivo, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Erro ao enviar arquivo." },
      { status: 500 }
    );
  }

  // Gerar URL pública
  const { data: urlData } = supabase.storage
    .from("uploads")
    .getPublicUrl(nomeArquivo);

  return NextResponse.json({
    success: true,
    message: "Upload realizado com sucesso.",
    url: urlData.publicUrl,
    nomeArquivo,
  });
}
