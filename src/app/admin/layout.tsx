import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Só utilizadores registados em public.admins entram no painel
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/auth/login?erro=sem-permissao')

  return (
    <div className="min-h-screen bg-zinc-950 lg:flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 min-w-0">
        {children}
      </main>
    </div>
  )
}
