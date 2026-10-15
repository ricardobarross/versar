import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LojaNavbar from '@/components/loja/Navbar'
import { CarrinhoProvider } from '@/components/loja/CarrinhoContext'
import WhatsAppFlutuante from '@/components/loja/WhatsAppFlutuante'
import { CONFIG_SELECT, linksSociais, type ConfigLoja } from '@/lib/loja'

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.from('store_settings').select(CONFIG_SELECT).maybeSingle()
  const config = data as ConfigLoja | null
  const links = linksSociais(config)
  const nome = config?.nome_loja ?? 'VERSAR'

  return (
    <CarrinhoProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <LojaNavbar config={config} />
        <main className="flex-1">{children}</main>
        <footer className="bg-zinc-950 text-zinc-400 text-sm mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-white font-bold tracking-widest">{nome}</p>
              {config?.banner_subtitulo && <p className="mt-2">{config.banner_subtitulo}</p>}
            </div>
            <nav className="flex flex-col gap-2">
              <p className="text-white font-semibold mb-1">Loja</p>
              <Link href="/produtos" className="hover:text-white">Produtos</Link>
              <Link href="/carrinho" className="hover:text-white">Carrinho</Link>
            </nav>
            {(links.whatsapp || links.instagram || links.facebook) && (
              <div className="flex flex-col gap-2">
                <p className="text-white font-semibold mb-1">Contato</p>
                {links.whatsapp && <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>}
                {links.instagram && <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>}
                {links.facebook && <a href={links.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a>}
              </div>
            )}
          </div>
          <p className="border-t border-zinc-900 text-center py-6 text-xs">
            © {new Date().getFullYear()} {nome}. Todos os direitos reservados.
          </p>
        </footer>
        {links.whatsapp && <WhatsAppFlutuante href={links.whatsapp} />}
      </div>
    </CarrinhoProvider>
  )
}
