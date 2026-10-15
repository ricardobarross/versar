import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireAdmin(req);

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, categories: data as Category[] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao listar categorias." },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase } = await requireAdmin(req);

    const body = await req.json();
    const { name, slug, description, is_active } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: name, slug." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        description: description || null,
        is_active: is_active ?? true,
      })
      .select("*")
      .single<Category>();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao criar categoria." },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { supabase } = await requireAdmin(req);

    const body = await req.json();
    const { id, name, slug, description, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID da categoria é obrigatório." },
        { status: 400 }
      );
    }

    // Nota: tabela categories não tem coluna updated_at no schema
    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        slug,
        description: description ?? null,
        is_active,
      })
      .eq("id", id)
      .select("*")
      .single<Category>();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao atualizar categoria." },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase } = await requireAdmin(req);

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID da categoria é obrigatório." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: "Categoria removida com sucesso." },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao remover categoria." },
      { status: error.status || 500 }
    );
  }
}

