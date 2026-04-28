'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Fornecedor } from '@/types'

export default function FornecedorForm({ fornecedor }: { fornecedor?: Fornecedor }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [nome, setNome] = useState(fornecedor?.nome ?? '')
  const [contato, setContato] = useState(fornecedor?.contato ?? '')
  const [telefone, setTelefone] = useState(fornecedor?.telefone ?? '')
  const [email, setEmail] = useState(fornecedor?.email ?? '')
  const [endereco, setEndereco] = useState(fornecedor?.endereco ?? '')
  const [notas, setNotas] = useState(fornecedor?.notas ?? '')
  const [ativo, setAtivo] = useState(fornecedor?.ativo ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const dados = { nome, contato, telefone, email, endereco, notas, ativo }

    const { error } = fornecedor?.id
      ? await supabase.from('fornecedores').update(dados).eq('id', fornecedor.id)
      : await supabase.from('fornecedores').insert(dados)

    if (error) { setErro(error.message); setLoading(false); return }

    router.push('/admin/fornecedores')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Informações do fornecedor</h2>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Nome *</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} required
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="Ex: Têxtil ABC" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Nome do contato</label>
            <input type="text" value={contato} onChange={e => setContato(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="Ex: Maria Santos" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Telefone</label>
            <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="+55 81 99999-9999" />
          </div>
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="contato@fornecedor.com" />
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Endereço</label>
          <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="Endereço completo" />
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Notas</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none resize-none"
            placeholder="Observações internas..." />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-zinc-300 text-sm">Fornecedor ativo</span>
        </label>
      </div>

      {erro && <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {loading ? 'Salvando...' : fornecedor ? 'Salvar alterações' : 'Cadastrar fornecedor'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-zinc-400 px-8 py-3 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}