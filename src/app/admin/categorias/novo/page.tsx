'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').eq('id', params.id).single()
      .then(({ data }) => {
        if (data) { setName(data.name); setIsActive(data.is_active) }
      })
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { error: err } = await supabase.from('categories').update({ name, slug, is_active: isActive }).eq('id', params.id)

    if (err) { setError(err.message); setLoading(false); return }

    router.push('/admin/categorias')
    router.refresh()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Edit Category</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="Ex: Shirts" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-zinc-300 text-sm">Active category</span>
          </label>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="text-zinc-400 px-8 py-3 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}