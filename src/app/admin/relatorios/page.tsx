import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Package, ShoppingBag, Users } from 'lucide-react'

export default async function RelatoriosPage() {
  const supabase = createClient()

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
  const inicioMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString()
  const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString()

  const [
    { data: pedidosMes },
    { data: pedidosMesPassado },
    { data: produtosMaisVendidos },
    { count: totalClientes },
  ] = await Promise.all([
    supabase.from('pedidos').select('total, status, created_at').gte('created_at', inicioMes).neq('status', 'cancelado'),
    supabase.from('pedidos').select('total').gte('created_at', inicioMesPassado).lte('created_at', fimMesPassado).neq('status', 'cancelado'),
    supabase.from('pedido_itens').select('quantidade, preco_unitario, produtos(nome)').limit(50),
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
  ])

  const totalMes = pedidosMes?.reduce((acc, p) => acc + p.total, 0) ?? 0
  const totalMesPassado = pedidosMesPassado?.reduce((acc, p) => acc + p.total, 0) ?? 0
  const crescimento = totalMesPassado > 0 ? ((totalMes - totalMesPassado) / totalMesPassado * 100).toFixed(1) : null

  // Agrupar produtos mais vendidos
  const vendas: Record<string, { nome: string; quantidade: number; total: number }> = {}
  produtosMaisVendidos?.forEach((item: any) => {
    const nome = item.produtos?.nome ?? 'Desconhecido'
    if (!vendas[nome]) vendas[nome] = { nome, quantidade: 0, total: 0 }
    vendas[nome].quantidade += item.quantidade
    vendas[nome].total += item.quantidade * item.preco_unitario
  })
  const ranking = Object.values(vendas).sort((a, b) => b.quantidade - a.quantidade).slice(0, 10)

  const statusCount: Record<string, number> = {}
  pedidosMes?.forEach(p => {
    statusCount[p.status] = (statusCount[p.status] ?? 0) + 1
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Relatórios</h1>

      {/* Cards resumo */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="bg-green-500 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp size={20} className="text-white" />
          </div>
          <p className="text-zinc-400 text-sm">Faturamento este mês</p>
          <p className="text-white text-2xl font-bold mt-1">
            R$ {totalMes.toFixed(2).replace('.', ',')}
          </p>
          {crescimento && (
            <p className={`text-sm mt-1 ${parseFloat(crescimento) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(crescimento) >= 0 ? '+' : ''}{crescimento}% vs mês passado
            </p>
          )}
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <p className="text-zinc-400 text-sm">Pedidos este mês</p>
          <p className="text-white text-2xl font-bold mt-1">{pedidosMes?.length ?? 0}</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="bg-orange-500 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp size={20} className="text-white" />
          </div>
          <p className="text-zinc-400 text-sm">Ticket médio</p>
          <p className="text-white text-2xl font-bold mt-1">
            R$ {pedidosMes && pedidosMes.length > 0
              ? (totalMes / pedidosMes.length).toFixed(2).replace('.', ',')
              : '0,00'}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="bg-purple-500 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <Users size={20} className="text-white" />
          </div>
          <p className="text-zinc-400 text-sm">Total de clientes</p>
          <p className="text-white text-2xl font-bold mt-1">{totalClientes ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Produtos mais vendidos */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Package size={18} /> Produtos mais vendidos
          </h2>
          {ranking.length === 0 && (
            <p className="text-zinc-500 text-sm">Nenhuma venda registrada ainda.</p>
          )}
          <div className="space-y-3">
            {ranking.map((item, index) => (
              <div key={item.nome} className="flex items-center gap-3">
                <span className="text-zinc-600 text-sm w-5">{index + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{item.nome}</p>
                  <p className="text-zinc-500 text-xs">{item.quantidade} unidades</p>
                </div>
                <span className="text-zinc-300 text-sm font-medium">
                  R$ {item.total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status dos pedidos */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag size={18} /> Pedidos por status (este mês)
          </h2>
          {Object.keys(statusCount).length === 0 && (
            <p className="text-zinc-500 text-sm">Nenhum pedido este mês.</p>
          )}
          <div className="space-y-3">
            {Object.entries(statusCount).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm capitalize">{status}</span>
                <span className="text-white font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}