import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

export default async function CategoriasPage() {
  const supabase = createClient()
  const { data: categorias } = await supabase.from('categorias').select('*').order('nome')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Categorias</h1>
        <Link href="/admin/categorias/novo"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition-colors">
          <Plus size={18} /> Nova categoria
        </Link>
      </div>

      {(!categorias || categorias.length === 0) && (
        <div className="bg-zinc-900 rounded-2xl p-12 border border-zinc-800 text-center">
          <p className="text-zinc-400">Nenhuma categoria criada ainda.</p>
        </div>
      )}

      {categorias && categorias.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {categorias.map((cat) => (
            <div key={cat.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold">{cat.nome}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cat.ativo ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {cat.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <p className="text-zinc-500 text-sm mt-0.5">/{cat.slug}</p>
              </div>
              <Link href={`/admin/categorias/${cat.id}`}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <Pencil size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}