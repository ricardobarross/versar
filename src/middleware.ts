import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Renova a sessão do Supabase e protege o /admin.
 * A verificação de "é admin" fica no layout do /admin (consulta à base).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // getUser() valida o token no Supabase (getSession() só lê o cookie)
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  if (path.startsWith('/admin') && !user) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }
  // (com ?erro= deixamos a página mostrar a mensagem e terminar a sessão)
  if (path.startsWith('/auth/login') && user && !request.nextUrl.searchParams.has('erro')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/auth/login'],
}
