import { createClient } from '@/lib/supabase/server'
import SenhaForm from '@/components/admin/SenhaForm'

export const metadata = { title: 'Minha conta' }

export default async function ContaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: admin } = await supabase
    .from('admins')
    .select('name, email')
    .eq('user_id', user!.id)
    .maybeSingle()

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Minha conta</h1>
      <div className="space-y-4 sm:space-y-6 max-w-xl">
        <section className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
          <p className="text-zinc-500 text-xs">Nome</p>
          <p className="text-white">{admin?.name ?? '—'}</p>
          <p className="text-zinc-500 text-xs mt-3">E-mail</p>
          <p className="text-white">{user!.email}</p>
        </section>
        <section className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
          <h2 className="text-white font-semibold mb-4">Alterar senha</h2>
          <SenhaForm email={user!.email!} />
        </section>
      </div>
    </div>
  )
}
