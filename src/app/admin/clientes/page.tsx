import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil, Phone, Mail } from 'lucide-react'

export default async function ClientesPage() {
  const supabase = createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('nome')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <Link
          href="/admin/clientes/novo"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
        >
          <Plus size={18} />
          Novo cliente
        </Link>
      </div>

      {(!clientes || clientes.length === 0) && (
        <div className="bg-zinc-900 rounded-2xl p-12 border border-zinc-800 text-center">
          <p className="text-zinc-400">Nenhum cliente cadastrado ainda.</p>
        </div>
      )}

      {clientes && clientes.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold flex-shrink-0">
                {cliente.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold">{cliente.nome}</h3>
                <div className="flex items-center gap-4 mt-1">
                  {cliente.whatsapp && (
                    <span className="text-zinc-400 text-sm flex items-center gap-1">
                      <Phone size={12} /> {cliente.whatsapp}
                    </span>
                  )}
                  {cliente.email && (
                    <span className="text-zinc-400 text-sm flex items-center gap-1">
                      <Mail size={12} /> {cliente.email}
                    </span>
                  )}
                  {cliente.cidade && (
                    <span className="text-zinc-400 text-sm">{cliente.cidade}/{cliente.estado}</span>
                  )}
                </div>
              </div>
              <Link
                href={`/admin/clientes/${cliente.id}`}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Pencil size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}