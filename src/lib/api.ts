import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export type AdminContext = { supabase: SupabaseClient; user: User }

/**
 * Garante que o pedido vem de um administrador ativo (tabela public.admins).
 *
 * Aceita:
 *  - a sessão do painel (cookies do Supabase, definidos no /auth/login);
 *  - `Authorization: Bearer <access_token>` para integrações externas.
 *
 * Devolve um cliente Supabase autenticado como esse utilizador, por isso o
 * RLS continua a ser aplicado em todas as consultas.
 */
export async function requireAdmin(req?: Request): Promise<AdminContext> {
  const bearer = req?.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]

  const supabase: SupabaseClient = bearer
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${bearer}` } },
        }
      )
    : await createSessionClient()

  const { data: { user }, error } = bearer
    ? await supabase.auth.getUser(bearer)
    : await supabase.auth.getUser()

  if (error || !user) throw new HttpError(401, 'Não autenticado.')

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
  if (adminError || !isAdmin) throw new HttpError(403, 'Sem permissão de administrador.')

  return { supabase, user }
}

/** Converte exceções em respostas JSON consistentes. */
export function apiError(err: unknown, fallback = 'Erro interno.') {
  if (err instanceof HttpError) {
    return NextResponse.json({ success: false, error: err.message }, { status: err.status })
  }
  console.error('[API]', err)
  return NextResponse.json({ success: false, error: fallback }, { status: 500 })
}

/** Lança 500 com a mensagem indicada se a consulta Supabase falhou. */
export function check<T>(result: { data: T | null; error: { message: string } | null }, message: string): T {
  if (result.error) {
    console.error('[DB]', message, result.error.message)
    throw new HttpError(500, message)
  }
  return result.data as T
}

/** Lê o corpo JSON e devolve 400 se não for um objeto válido. */
export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const body = await req.json()
    if (!body || typeof body !== 'object') throw new Error()
    return body as T
  } catch {
    throw new HttpError(400, 'Corpo do pedido inválido (JSON esperado).')
  }
}

/** Mantém só os campos permitidos (evita gravar colunas arbitrárias). */
export function pick<T extends Record<string, unknown>>(body: T, fields: readonly string[]) {
  const out: Record<string, unknown> = {}
  for (const f of fields) if (f in body) out[f] = body[f]
  return out
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function assertUuid(id: string, label = 'ID') {
  if (!UUID_RE.test(id)) throw new HttpError(400, `${label} inválido.`)
}
