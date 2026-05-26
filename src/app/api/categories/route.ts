import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/app/api/admin/auth/route";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Configuração do Supabase ausente.");
  }

  return { url, anonKey };
}

function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, categories: data as Category[] },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao listar categorias." },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { name, slug, description, is_active } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: name, slug." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

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
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, category: data },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao criar categoria." },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { id, name, slug, description, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID da categoria é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        slug,
        description: description ?? null,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single<Category>();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, category: data },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error
