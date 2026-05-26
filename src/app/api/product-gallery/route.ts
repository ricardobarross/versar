import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/app/api/admin/auth/route";

type ProductGalleryItem = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  position: number;
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

    const productId = req.nextUrl.searchParams.get("product_id");

    const supabase = createSupabaseServerClient();

    const query = supabase.from("product_gallery").select("*");

    if (productId) {
      query.eq("product_id", productId);
    }

    const { data, error } = await query.order("position", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, gallery: data as ProductGalleryItem[] },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao listar galeria.",
      },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { product_id, image_url, alt_text, position } = body;

    if (!product_id || !image_url) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: product_id, image_url." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("product_gallery")
      .insert({
        product_id,
        image_url,
        alt_text: alt_text || null,
        position: position ?? 0,
      })
      .select("*")
      .single<ProductGalleryItem>();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, item: data },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao adicionar imagem à galeria.",
      },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { id, image_url, alt_text, position } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID da imagem é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("product_gallery")
      .update({
        image_url,
        alt_text: alt_text ?? null,
        position: position ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single<ProductGalleryItem>();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, item: data },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao atualizar imagem da galeria.",
      },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID da imagem é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("product_gallery")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Imagem removida da galeria." },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao remover imagem da galeria.",
      },
      { status: error.status || 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Token",
      },
    }
  );
}

