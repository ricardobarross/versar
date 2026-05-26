import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// DELETE /api/destaques/[id]
// Remove destaque
// =====================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = supabaseServer();

  const { error } = await supabase
    .from("destaques")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao apagar destaque." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Destaque removido com sucesso.",
  });
}