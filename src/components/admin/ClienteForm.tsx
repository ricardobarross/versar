'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Cliente } from '@/types'

type Props = {
  cliente?: Cliente
}

export default function ClienteForm({ cliente }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [whatsapp, setWhatsapp] = useState(cliente?.whatsapp ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [cpf, setCpf] = useState(cliente?.cpf ?? '')
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '')
  const [cidade, setCidade] = useState(cliente?.cidade ?? '')
  const [estado, setEstado] = useState(cliente?.estado ?? '')
  const [cep, setCep] = useState(cliente?.cep ?? '')
  const [notas, setNotas] = useState(cliente?.notas ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const dados = { nome, whatsapp, email, cpf, endereco, cidade, estado, cep, notas }

    const { error } = cliente?.id
      ? await supabase.from('clientes').update(dados).eq('id', cliente.id)
      : await supabase.from('clientes').insert(dados)

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    router.push('/admin/clientes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Informações pessoais</h2>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Nome completo *</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} required
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="Ex: João Silva" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">WhatsApp</label>
            <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="+55 81 99999-9999" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="email@exemplo.com" />
          </div>
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">CPF</label>
          <input type="text" value={cpf} onChange={e => setCpf(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="000.000.000-00" />
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Endereço</h2>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Endereço</label>
          <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="Rua, número, bairro" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-zinc-400 text-sm mb-2">Cidade</label>
            <input type="text" value={cidade} onChange={e => setCidade(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="Ex: Recife" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Estado</label>
            <input type="text" value={estado} onChange={e => setEstado(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="PE" maxLength={2} />
          </div>
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">CEP</label>
          <input type="text" value={cep} onChange={e => setCep(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="00000-000" />
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Observações</h2>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
          className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none resize-none"
          placeholder="Notas internas sobre o cliente..." />
      </div>

      {erro && <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {loading ? 'Salvando...' : cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-zinc-400 px-8 py-3 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}