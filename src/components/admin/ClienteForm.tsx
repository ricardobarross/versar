'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Cliente = {
  id?: string
  name?: string
  phone?: string | null
  email?: string | null
  document?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
}

type Props = { cliente?: Cliente }

export default function ClienteForm({ cliente }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [name, setName] = useState(cliente?.name ?? '')
  const [phone, setPhone] = useState(cliente?.phone ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [document, setDocument] = useState(cliente?.document ?? '')
  const [address, setAddress] = useState(cliente?.address ?? '')
  const [city, setCity] = useState(cliente?.city ?? '')
  const [state, setState] = useState(cliente?.state ?? '')
  const [zipCode, setZipCode] = useState(cliente?.zip_code ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const dados = { name, phone, email, document, address, city, state, zip_code: zipCode }

    const { error } = cliente?.id
      ? await supabase.from('customers').update(dados).eq('id', cliente.id)
      : await supabase.from('customers').insert(dados)

    if (error) { setErro(error.message); setLoading(false); return }

    router.push('/admin/clientes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Informações pessoais</h2>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Nome completo *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="Ex: João Silva" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Telefone / WhatsApp</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="+55 81 99999-9999" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="email@exemplo.com" />
          </div>
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">CPF / Documento</label>
          <input type="text" value={document} onChange={e => setDocument(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="000.000.000-00" />
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Endereço</h2>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Endereço</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="Rua, número, bairro" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-zinc-400 text-sm mb-2">Cidade</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="Ex: Recife" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Estado</label>
            <input type="text" value={state} onChange={e => setState(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="PE" maxLength={2} />
          </div>
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">CEP</label>
          <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="00000-000" />
        </div>
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