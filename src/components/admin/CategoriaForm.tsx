'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/slug'

type Categoria = { id: string; name: string; description: string | null; is_active: boolean }

export default function CategoriaForm({ categoria }: { categoria?: Categoria }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [nome, setNome] = useState(categoria?.name ?? '')
  const [descricao, setDescricao] = useState(categoria?.description ?? '')
  const [ativo, setAtivo] = useState(categoria?.is_active ?? true)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const dados = {
      name: nome.trim(),
      slug: slugify(nome),
      description: descricao.trim() || null,
      is_active: ativo,
    }

    const { error } = categoria
      ? await supabase.from('categories').update(dados).eq('id', categoria.id)
      : await supabase.from('categories').insert(dados)

    if (error) {
      setErro(error.code === '23505' ? 'Já existe uma categoria com esse nome.' : error.message)
      setLoading(false)
      return
    }

    router.push('/admin/categorias')
    router.refresh()
  }

  const input = 'w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Nome *</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className={input} placeholder="Ex: Camisas" />
          {nome && <p className="text-zinc-500 text-xs mt-1">Endereço: /categoria/{slugify(nome)}</p>}
        </div>
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Descrição</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} className={input} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-zinc-300 text-sm">Categoria ativa (visível na loja)</span>
        </label>
      </div>

      {erro && <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {loading ? 'Salvando...' : categoria ? 'Salvar alterações' : 'Criar categoria'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-zinc-400 px-8 py-3 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
