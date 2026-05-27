import { createClient } from '@/lib/supabase/server'
import { Package, Users, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = createClient()

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalProdutos },
    { count: totalClientes },
    { count: totalPedidos },
    { data: vendasMes },
    { data: pedidosRecentes },
    { count: pedidosPendentes },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total').eq('status', 'completed').gte('created_at', firstDayOfMonth),
    supabase.from('orders').select('id, total, status, created_at, customers(name)').order('created_at', { ascending: false }).limit(8),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const totalMes = vendasMes?.reduce((acc, o) => acc + Number(o.total), 0) ?? 0

  const statusLabel: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    shipped: 'Enviado',
    completed: 'Entregue',
    cancelled: 'Cancelado',
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    shipped: 'bg-purple-500/20 text-purple-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }

  const cards = [
    { label: 'Produtos ativos', value: totalProdutos ?? 0, icon: Package, color: 'bg-blue-500', href: '/admin/produtos' },
    { label: 'Clientes', value: totalClientes ?? 0, icon: Users, color: 'bg-green-500', href: '/admin/clientes' },
    { label: 'Pedidos totais', value: totalPedidos ?? 0, icon: ShoppingBag, color: 'bg-orange-500', href: '/admin/pedidos' },
    { label: 'Vendas este mês', value: `R$ ${totalMes.toFixed(2).replace('.', ',')}`, icon: TrendingUp, color: 'bg-purple-500', href: '/admin/relatorios' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
        {(pedidosPendentes ?? 0) > 0 && (
          <Link href="/admin/pedidos" className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors">
            <AlertCircle size={14} />
            {pedidosPendentes} pedido(s) pendente(s)
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 hover:border-zinc-600 transition-colors">
            <div className={`${color} w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm">{label}</p>
            <p className="text-white text-xl sm:text-2xl font-bold mt-1">{value}</p>
          </Link>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Pedidos recentes</h2>
          <Link href="/admin/pedidos" className="text-zinc-400 text-sm hover:text-white transition-colors">Ver todos →</Link>
        </div>
        {!pedidosRecentes || pedidosRecentes.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nenhum pedido ainda.</p>
        ) : (
          <div className="space-y-3">
            {pedidosRecentes.map((pedido: any) => (
              <div key={pedido.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{pedido.customers?.name ?? 'Cliente'}</p>
                  <p className="text-zinc-500 text-xs">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[pedido.status] ?? 'bg-zinc-700 text-zinc-300'}`}>
                    {statusLabel[pedido.status] ?? pedido.status}
                  </span>
                  <span className="text-white text-sm font-semibold">R$ {Number(pedido.total).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
