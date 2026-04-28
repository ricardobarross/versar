'use client'

import Link from 'next/link'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useState } from 'react'
import type { ConfiguracoesLoja } from '@/types'

export default function LojaNavbar({ config }: { config: ConfiguracoesLoja | null }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-zinc-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-zinc-950 tracking-widest">
          {config?.nome_loja ?? 'VERSAR'}
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-zinc-600 hover:text-zinc-950 text-sm transition-colors">
            Início
          </Link>
          <Link href="/#produtos" className="text-zinc-600 hover:text-zinc-950 text-sm transition-colors">
            Produtos
          </Link>
          {config?.whatsapp && (
            <a
              href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-950 text-white px-4 py-2 rounded-lg text-sm hover:bg-zinc-800 transition-colors"
            >
              Fale conosco
            </a>
          )}
        </nav>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-zinc-950">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-4 space-y-3">
          <Link href="/" onClick={() => setMenuOpen(false)} className="block text-zinc-600 text-sm">
            Início
          </Link>
          <Link href="/#produtos" onClick={() => setMenuOpen(false)} className="block text-zinc-600 text-sm">
            Produtos
          </Link>
          {config?.whatsapp && (
            <a 
              href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block bg-zinc-950 text-white px-4 py-2 rounded-lg text-sm text-center"
            >
              Fale conosco
            </a>
          )}
        </div>
      )}
    </header>
  )
}