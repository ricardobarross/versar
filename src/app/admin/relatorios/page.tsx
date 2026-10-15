import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Package, ShoppingBag, Users } from 'lucide-react'
import { orderStatusMeta } from '@/lib/orders'

export default async function ReportsPage() {
  const supabase = await createClient()

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
  const inicioMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString()
  const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString()

  const [
    { data: ordersMes },
    { data: ordersMesPassado },
    { data: topItems },
    { count: totalCustomers },
  ] = await Promise.all([
    supabase.from('orders').select('total, status, created_at').gte('created_at', inicioMes).neq('status', 'canceled'),
    supabase.from('orders').select('total').gte('created_at', inicioMesPassado).lte('created_at', fimMesPassado).neq('status', 'canceled'),
    supabase.from('order_items').select('quantity, price, products(name)').limit(50),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
  ])

  const totalMes = ordersMes?.reduce((acc, p) => acc + Number(p.total), 0) ?? 0
  const totalMesPassado = ordersMesPassado?.reduce((acc, p) => acc + Number(p.total), 0) ?? 0
  const growth = totalMesPassado > 0
    ? ((totalMes - totalMesPassado) / totalMesPassado * 100).toFixed(1)
    : null

  const salesMap: Record<string, { name: string; quantity: number; total: number }> = {}
  topItems?.forEach((item: any) => {
    const name = item.products?.name ?? 'Desconhecido'
    if (!salesMap[name]) salesMap[name] = { name, quantity: 0, total: 0 }
    salesMap[name].quantity += item.quantity
    salesMap[name].total += item.quantity * Number(item.price)
  })
  const ranking = Object.values(salesMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10)

  const statusCount: Record<string, number> = {}
  ordersMes?.forEach(p => {
    statusCount[p.status] = (statusCount[p.status] ?? 0) + 1
  })

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Reports</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
          <div className="bg-green-500 w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <TrendingUp size={18} className="text-white" />
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm">Faturamento do mês</p>
          <p className="text-white text-lg sm:text-2xl font-bold mt-1">
            R$ {totalMes.toFixed(2).replace('.', ',')}
          </p>
          {growth && (
            <p className={`text-xs sm:text-sm mt-1 ${parseFloat(growth) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(growth) >= 0 ? '+' : ''}{growth}% vs last month
            </p>
          )}
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
          <div className="bg-blue-500 w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <ShoppingBag size={18} className="text-white" />
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm">Pedidos este mês</p>
          <p className="text-white text-lg sm:text-2xl font-bold mt-1">{ordersMes?.length ?? 0}</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
          <div className="bg-orange-500 w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <TrendingUp size={18} className="text-white" />
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm">Average order value</p>
          <p className="text-white text-lg sm:text-2xl font-bold mt-1">
            R$ {ordersMes && ordersMes.length > 0
              ? (totalMes / ordersMes.length).toFixed(2).replace('.', ',')
              : '0,00'}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
          <div className="bg-purple-500 w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <Users size={18} className="text-white" />
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm">Total de clientes</p>
          <p className="text-white text-lg sm:text-2xl font-bold mt-1">{totalCustomers ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Package size={16} /> Produtos mais vendidos
          </h2>
          {ranking.length === 0 ? (
            <p className="text-zinc-500 text-sm">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {ranking.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm w-5 flex-shrink-0">{index + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{item.name}</p>
                    <p className="text-zinc-500 text-xs">{item.quantity} units</p>
                  </div>
                  <span className="text-zinc-300 text-sm font-medium flex-shrink-0">
                    R$ {item.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
            <ShoppingBag size={16} /> Pedidos por status (este mês)
          </h2>
          {Object.keys(statusCount).length === 0 ? (
            <p className="text-zinc-500 text-sm">Nenhum pedido este mês.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusCount).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm">{orderStatusMeta(status).label}</span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}