import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  novo:        { label: 'Novo',       color: 'bg-blue-900 text-blue-400'   },
  confirmado:  { label: 'Confirmado', color: 'bg-yellow-900 text-yellow-400' },
  separando:   { label: 'Separando',  color: 'bg-orange-900 text-orange-400' },
  enviado:     { label: 'Enviado',    color: 'bg-purple-900 text-purple-400' },
  entregue:    { label: 'Entregue',   color: 'bg-green-900 text-green-400'  },
  cancelado:   { label: 'Cancelado',  color: 'bg-red-900 text-red-400'     },
}

export default async function PedidosPage() {
  const supabase = createClient()

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, clientes(nome, whatsapp)')
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Header */}
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

      {/* Vazio */}
      {(!pedidos || pedidos.length === 0) && (
        <div className="bg-zinc-900 rounded-2xl p-12 border border-zinc-800 text-center">
          <p className="text-zinc-400">Nenhum pedido registrado ainda.</p>
        </div>
      )}

      {/* Lista */}
      {pedidos && pedidos.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {pedidos.map((pedido) => {
            const status = STATUS_LABELS[pedido.status] ?? STATUS_LABELS.novo
            return (
              <div
                key={pedido.id}
                className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-4"
              >
                {/* Número */}
                <div className="flex-shrink-0 text-center min-w-[3rem]">
                  <span className="text-zinc-500 text-xs block">Pedido</span>
                  <p className="text-white font-bold text-sm">#{pedido.numero}</p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {pedido.clientes?.nome ?? 'Cliente não identificado'}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {pedido.clientes?.whatsapp && (
                      <span className="text-zinc-400 text-xs">{pedido.clientes.whatsapp}</span>
                    )}
                    <span className="text-zinc-400 text-xs">
                      {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {pedido.origem && (
                      <span className="text-zinc-400 text-xs capitalize">{pedido.origem}</span>
                    )}
                  </div>
                </div>

                {/* Total + Editar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">
                      R$ {pedido.total.toFixed(2).replace('.', ',')}
                    </p>
                    {pedido.forma_pagamento && (
                      <p className="text-zinc-500 text-xs">{pedido.forma_pagamento}</p>
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