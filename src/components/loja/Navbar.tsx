'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl tracking-widest text-zinc-900 hover:text-zinc-600 transition-colors">
            VERSAR
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
          <div className="flex items-center gap-3">
            <button
              className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
              aria-label="Pesquisar"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/carrinho"
              className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors relative"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
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
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/"
              className="block text-sm font-medium text-zinc-700 hover:text-zinc-900 py-2"
              onClick={() => setMenuAberto(false)}
            >
              Início
            </Link>
            <Link
              href="/produtos"
              className="block text-sm font-medium text-zinc-700 hover:text-zinc-900 py-2"
              onClick={() => setMenuAberto(false)}
            >
              Produtos
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
