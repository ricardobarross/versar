import { createClient } from '@supabase/supabase-js'

/**
 * Cliente com a service role: ignora o RLS.
 * Usar APENAS em rotas públicas que precisam de escrever com regras próprias
 * (checkout, webhooks). Rotas do painel devem usar `requireAdmin()`.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Configuração do Supabase ausente (URL ou SERVICE_ROLE_KEY).')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
