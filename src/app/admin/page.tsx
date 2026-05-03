import { createClient } from '@/lib/supabase/server'
import { Package, Users, ShoppingBag, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = createClient()

  const [
    { count: totalProdutos },
    { count: totalClientes },
    { count: totalPedidos },
  ] = await Promise.all([
    supabase.from('produtos').select('*', { count: 'exact', head: true }),
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('pedidos').select('*', { count: 'exact', head: true }),
  ])

  const cards = [
    { label: 'Produtos', value: totalProdutos ?? 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Clientes', value: totalClientes ?? 0, icon: Users, color: 'bg-green-500' },
    { label: 'Pedidos', value: totalPedidos ?? 0, icon: ShoppingBag, color: 'bg-orange-500' },
    { label: 'Este mês', value: 'R$ 0,00', icon: TrendingUp, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Dashboard</h1>

      {/* Cards — 2 colunas mobile, 4 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
            <div className={`${color} w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm">{label}</p>
            <p className="text-white text-xl sm:text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
        <h2 className="text-white font-semibold mb-4">Pedidos recentes</h2>
        <p className="text-zinc-500 text-sm">Nenhum pedido ainda. Os pedidos aparecerão aqui.</p>
      </div>
    </div>
  )
}