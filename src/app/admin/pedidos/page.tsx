import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'bg-blue-900 text-blue-400' },
  confirmado: { label: 'Confirmado', color: 'bg-yellow-900 text-yellow-400' },
  separando: { label: 'Separando', color: 'bg-orange-900 text-orange-400' },
  enviado: { label: 'Enviado', color: 'bg-purple-900 text-purple-400' },
  entregue: { label: 'Entregue', color: 'bg-green-900 text-green-400' },
  cancelado: { label: 'Cancelado', color: 'bg-red-900 text-red-400' },
}

export default async function PedidosPage() {
  const supabase = createClient()

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, clientes(nome, whatsapp)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <Link href="/admin/pedidos/novo"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition-colors">
          <Plus size={18} /> Novo pedido
        </Link>
      </div>

      {(!pedidos || pedidos.length === 0) && (
        <div className="bg-zinc-900 rounded-2xl p-12 border border-zinc-800 text-center">
          <p className="text-zinc-400">Nenhum pedido registrado ainda.</p>
        </div>
      )}

      {pedidos && pedidos.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {pedidos.map((pedido) => {
            const status = STATUS_LABELS[pedido.status] ?? STATUS_LABELS.novo
            return (
              <div key={pedido.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex items-center gap-4">
                <div className="flex-shrink-0 text-center">
                  <span className="text-zinc-500 text-xs">Pedido</span>
                  <p className="text-white font-bold">#{pedido.numero}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">
                      {pedido.clientes?.nome ?? 'Cliente não identificado'}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {pedido.clientes?.whatsapp && (
                      <span className="text-zinc-400 text-sm">{pedido.clientes.whatsapp}</span>
                    )}
                    <span className="text-zinc-400 text-sm">
                      {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-zinc-400 text-sm capitalize">{pedido.origem}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold">
                    R$ {pedido.total.toFixed(2).replace('.', ',')}
                  </p>
                  {pedido.forma_pagamento && (
                    <p className="text-zinc-500 text-xs mt-0.5">{pedido.forma_pagamento}</p>
                  )}
                </div>

                <Link href={`/admin/pedidos/${pedido.id}`}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                  <Pencil size={16} />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}