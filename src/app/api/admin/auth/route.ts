import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type AdminUser = {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type RequireAdminResult = {
  user: AdminUser;
  supabase: SupabaseClient;
};

class UnauthorizedError extends Error {
  public readonly status: number;

  constructor(message = "Não autorizado") {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}

class ForbiddenError extends Error {
  public readonly status: number;

  constructor(message = "Acesso negado") {
    super(message);
    this.name = "ForbiddenError";
    this.status = 403;
  }
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Configuração do Supabase ausente (URL ou ANON KEY).");
  }

  return { url, anonKey };
}

function createSupabaseServerClient(accessToken?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });

  return client;
}

/**
 * Padrão de proteção para rotas admin.
 *
 * Uso em outras rotas:
 *   import { requireAdmin } from "@/app/api/admin/auth/route";
 *
 *   export async function GET(req: NextRequest) {
 *     const { user, supabase } = await requireAdmin(req);
 *     // lógica protegida...
 *   }
 */
export async function requireAdmin(req: NextRequest): Promise<RequireAdminResult> {
  const adminToken =
    req.cookies.get("admin_token")?.value ||
    req.headers.get("x-admin-token") ||
    "";

  if (!adminToken) {
    throw new UnauthorizedError("Token de administrador não encontrado.");
  }

  const supabase = createSupabaseServerClient(adminToken);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthorizedError("Sessão de administrador inválida ou expirada.");
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single<AdminUser>();

  if (adminError || !adminRecord) {
    throw new ForbiddenError("Usuário não possui privilégios de administrador.");
  }

  return {
    user: adminRecord,
    supabase,
  };
}

/**
 * Endpoint para validar sessão admin e obter dados básicos do administrador.
 * Rota: GET /api/admin/auth
 */
export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAdmin(req);

    return NextResponse.json(
      {
        success: true,
        admin: {
          id: user.id,
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status }
      );
    }

    console.error("[ADMIN_AUTH_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao validar administrador.",
      },
      { status: 500 }
    );
  }
}

/**
 * Opcional: método OPTIONS para CORS ou pré-flight em rotas admin.
 */
export async function OPTIONS() {
  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Token",
      },
    }
  );
}

