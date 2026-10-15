import { createClient } from '@supabase/supabase-js'

/** Endereço público da loja (SEO, sitemap, links). */
export function siteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  // definido automaticamente pela Vercel (domínio de produção)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return 'http://localhost:3000'
}

/** Cliente público (sem cookies) — para sitemap e páginas estáticas. Respeita o RLS. */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
