import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

import { ORDER_STATUSES, ORDER_STATUS_META, isOrderStatus, orderStatusMeta, formatBRL } from '@/lib/orders'

const ORIGENS: Record<string, string> = { loja_online: 'Loja online', painel: 'Painel', whatsapp: 'WhatsApp' }

export default async function PedidosPage(props: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status: statusFiltro, q } = await props.searchParams
  const busca = (q ?? '').trim().slice(0, 60)
  const supabase = await createClient()

  // número do pedido (#12 ou 12) → filtra por número; texto → nome do cliente
  const numero = busca.replace(/^#/, '')
  const porNumero = /^\d+$/.test(numero)
  const porNome = busca.length >= 2 && !porNumero

  let consulta = supabase
    .from('orders')
    .select(porNome ? '*, customers!inner(name, whatsapp)' : '*, customers(name, whatsapp)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (isOrderStatus(statusFiltro)) consulta = consulta.eq('status', statusFiltro)
  if (porNumero) consulta = consulta.eq('numero', Number(numero))
  if (porNome) consulta = consulta.ilike('customers.name', `%${busca.replace(/[\\%_]/g, m => `\\${m}`)}%`)

  const { data } = await consulta
  const pedidos = (data ?? []) as unknown as {
    id: string; numero: number; status: string; total: number; origin: string; payment_method: string | null
    created_at: string; customers: { name: string; whatsapp: string | null } | null
  }[]

  const filtroAtivo = Boolean(busca || statusFiltro)
  const linkStatus = (s?: string) => {
    const sp = new URLSearchParams()
    if (s) sp.set('status', s)
    if (busca) sp.set('q', busca)
    const qs = sp.toString()
    return `/admin/pedidos${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Pedidos</h1>
        <Link
          href="/admin/pedidos/novo"
          className="flex items-center gap-2 bg-white text-black px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition-colors text-sm sm:text-base"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Novo pedido</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      <form action="/admin/pedidos" className="flex gap-2 mb-3">
        {statusFiltro && <input type="hidden" name="status" value={statusFiltro} />}
        <input
          type="search"
          name="q"
          defaultValue={busca}
          placeholder="Buscar por nº do pedido ou nome do cliente"
          className="flex-1 bg-zinc-900 text-white rounded-lg px-4 py-2.5 border border-zinc-800 focus:border-zinc-500 focus:outline-none text-sm"
        />
        <button type="submit" className="bg-zinc-800 text-white text-sm px-4 rounded-lg hover:bg-zinc-700">Buscar</button>
      </form>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <Link href={linkStatus()} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${!statusFiltro ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}>
          Todos
        </Link>
        {ORDER_STATUSES.map(s => (
          <Link key={s} href={linkStatus(s)} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${statusFiltro === s ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}>
            {ORDER_STATUS_META[s].label}
          </Link>
        ))}
      </div>

      {pedidos.length === 0 && (
        <div className="bg-zinc-900 rounded-2xl p-12 border border-zinc-800 text-center">
          <p className="text-zinc-400">{filtroAtivo ? 'Nenhum pedido encontrado com esses filtros.' : 'Nenhum pedido registrado ainda.'}</p>
          {filtroAtivo && <Link href="/admin/pedidos" className="text-zinc-300 underline text-sm mt-2 inline-block">Limpar filtros</Link>}
        </div>
      )}

      {pedidos.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {pedidos.map((pedido) => {
            const status = orderStatusMeta(pedido.status)
            return (
              <div
                key={pedido.id}
                className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-4"
              >
                <div className="flex-shrink-0 text-center min-w-[3rem]">
                  <span className="text-zinc-500 text-xs block">Pedido</span>
                  <p className="text-white font-bold text-sm">#{pedido.numero}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {pedido.customers?.name ?? 'Cliente não identificado'}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {pedido.customers?.whatsapp && (
                      <span className="text-zinc-400 text-xs">{pedido.customers.whatsapp}</span>
                    )}
                    <span className="text-zinc-400 text-xs">
                      {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {pedido.origin && (
                      <span className="text-zinc-400 text-xs">{ORIGENS[pedido.origin] ?? pedido.origin}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">
                      {formatBRL(pedido.total)}
                    </p>
                    {pedido.payment_method && (
                      <p className="text-zinc-500 text-xs">{pedido.payment_method}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/pedidos/${pedido.id}`}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}