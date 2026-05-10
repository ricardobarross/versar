'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Phone, Mail, MapPin, Sparkles } from 'lucide-react'
import SecretariaSheet from '@/components/admin/SecretariaSheet'

interface Cliente {
  id: string
  nome: string
  whatsapp: string | null
  email: string | null
  cidade: string | null
  estado: string | null
}

export default function ClientesClient({ clientes }: { clientes: Cliente[] }) {
  const [secretaria, setSecretaria] = useState<{ id: string; nome: string } | null>(null)

  return (
    <>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Clientes</h1>
          <Link
            href="/admin/clientes/novo"
            className="flex items-center gap-2 bg-white text-black px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition-colors text-sm sm:text-base"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Novo cliente</span>
            <span className="sm:hidden">Novo</span>
          </Link>
        </div>

        {/* Vazio */}
        {clientes.length === 0 && (
          <div className="bg-zinc-900 rounded-2xl p-12 border border-zinc-800 text-center">
            <p className="text-zinc-400">Nenhum cliente cadastrado ainda.</p>
          </div>
        )}

        {/* Lista */}
        {clientes.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex items-start sm:items-center gap-3 sm:gap-4"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 sm:mt-0">
                  {cliente.nome.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{cliente.nome}</h3>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-4 mt-1">
                    {cliente.whatsapp && (
                      <span className="text-zinc-400 text-xs sm:text-sm flex items-center gap-1 truncate">
                        <Phone size={11} className="flex-shrink-0" />
                        <span className="truncate">{cliente.whatsapp}</span>
                      </span>
                    )}
                    {cliente.email && (
                      <span className="text-zinc-400 text-xs sm:text-sm flex items-center gap-1 truncate">
                        <Mail size={11} className="flex-shrink-0" />
                        <span className="truncate">{cliente.email}</span>
                      </span>
                    )}
                    {cliente.cidade && (
                      <span className="text-zinc-400 text-xs sm:text-sm flex items-center gap-1">
                        <MapPin size={11} className="flex-shrink-0" />
                        <span>{cliente.cidade}{cliente.estado ? `/${cliente.estado}` : ''}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Secretária */}
                  <button
                    onClick={() => setSecretaria({ id: cliente.id, nome: cliente.nome })}
                    className="p-2 text-zinc-500 hover:text-violet-400 hover:bg-violet-950/40 rounded-lg transition-colors"
                    title="Secretária inteligente"
                  >
                    <Sparkles size={16} />
                  </button>
                  {/* Editar */}
                  <Link
                    href={`/admin/clientes/${cliente.id}`}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    aria-label="Editar cliente"
                  >
                    <Pencil size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      <SecretariaSheet
        tipo="cliente"
        id={secretaria?.id ?? ''}
        nome={secretaria?.nome ?? ''}
        aberto={!!secretaria}
        onFechar={() => setSecretaria(null)}
      />
    </>
  )
}