'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingBag,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Menu,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/categorias', label: 'Categorias', icon: Tag },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  function isActive(item: typeof navItems[0]) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Botão Hambúrguer - Visível apenas em Mobile */}
      <button
        onClick={toggleMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 text-white rounded-lg border border-zinc-800 shadow-xl"
        aria-label="Abrir menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay Escuro - Fecha o menu ao clicar fora (apenas mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleMenu}
        />
      )}

      {/* Sidebar Principal */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
      `}>
        {/* Header da Sidebar */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-900">
          <Link href="/admin" className="flex items-center gap-3 font-bold text-lg text-white">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-black text-xs font-black">VS</span>
            </div>
            VERSAR ADMIN
          </Link>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} // Fecha o menu ao clicar num link no mobile
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-white text-black shadow-lg shadow-white/5'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-black' : 'text-zinc-500'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer: Ver Loja + Logout */}
        <div className="px-3 pb-4 space-y-1 border-t border-zinc-900 pt-4 bg-zinc-950/50">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <Store className="w-5 h-5 flex-shrink-0" />
            Ver Loja
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  )
}