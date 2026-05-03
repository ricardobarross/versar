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

2. Navbar.tsx — Contador + prop config tipada
typescript// src/components/loja/Navbar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'
import { useCarrinho } from '@/components/loja/CarrinhoContext'

interface ConfigLoja {
  nome_loja?: string | null
  [key: string]: unknown
}

export default function Navbar({ config }: { config?: ConfigLoja | null }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const { totalItens } = useCarrinho()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="font-bold text-xl tracking-widest text-zinc-900 hover:text-zinc-600 transition-colors">
            {config?.nome_loja ?? 'VERSAR'}
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Início
            </Link>
            <Link href="/produtos" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Produtos
            </Link>
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors" aria-label="Pesquisar">
              <Search className="w-5 h-5" />
            </button>

            <Link href="/carrinho" className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors relative" aria-label="Carrinho">
              <ShoppingCart className="w-5 h-5" />
              {totalItens > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-zinc-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {totalItens > 99 ? '99+' : totalItens}
                </span>
              )}
            </Link>

            {/* Menu Mobile */}
            <button
              className="md:hidden p-2 text-zinc-600 hover:text-zinc-900"
              onClick={() => setMenuAberto(!menuAberto)}
              aria-label="Menu"
            >
              {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Dropdown */}
      {menuAberto && (
        <div className="md:hidden border-t border-zinc-100 bg-white">
          <nav className="px-4 py-4 space-y-1">
            <Link href="/" className="block text-sm font-medium text-zinc-700 hover:text-zinc-900 py-3 border-b border-zinc-50" onClick={() => setMenuAberto(false)}>
              Início
            </Link>
            <Link href="/produtos" className="block text-sm font-medium text-zinc-700 hover:text-zinc-900 py-3 border-b border-zinc-50" onClick={() => setMenuAberto(false)}>
              Produtos
            </Link>
            <Link href="/carrinho" className="flex items-center justify-between text-sm font-medium text-zinc-700 hover:text-zinc-900 py-3" onClick={() => setMenuAberto(false)}>
              <span>Carrinho</span>
              {totalItens > 0 && (
                <span className="bg-zinc-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalItens}
                </span>
              )}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}