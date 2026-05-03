import { createClient } from '@/lib/supabase/server'
import LojaNavbar from '@/components/loja/Navbar'
import { CarrinhoProvider } from '@/components/loja/CarrinhoContext'

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: config } = await supabase.from('configuracoes_loja').select('*').single()

  return (
    <CarrinhoProvider>
      <div className="min-h-screen bg-white">
        <LojaNavbar config={config} />
        <main>{children}</main>
        <footer className="bg-zinc-950 text-zinc-400 text-center py-8 text-sm mt-16">
          <p>© {new Date().getFullYear()} {config?.nome_loja ?? 'VERSAR'}. Todos os direitos reservados.</p>
        </footer>
      </div>
    </CarrinhoProvider>
  )
}