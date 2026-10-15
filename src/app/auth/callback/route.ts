import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Destino dos links enviados por e-mail pelo Supabase (ex.: recuperar senha).
 * Troca o `code` por uma sessão e segue para `next` (só caminhos internos).
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/admin'
  const destino = next.startsWith('/') && !next.startsWith('//') ? next : '/admin'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(destino, url.origin))
  }

  return NextResponse.redirect(new URL('/auth/login?erro=link-invalido', url.origin))
}
