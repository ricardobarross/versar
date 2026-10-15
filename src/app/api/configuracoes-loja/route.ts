
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, pick } from "@/lib/api";
import { STORE_SETTINGS_FIELDS } from "@/lib/fields";

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireAdmin(req);

    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao carregar configurações." },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { supabase } = await requireAdmin(req);

    const body = pick(await req.json(), STORE_SETTINGS_FIELDS);

    const { data, error } = await supabase
      .from("store_settings")
      .update(body)
      .eq("id", 1)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao atualizar configurações." },
      { status: error.status || 500 }
    );
  }
}
