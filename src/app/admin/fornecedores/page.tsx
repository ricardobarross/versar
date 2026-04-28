import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil, Phone } from 'lucide-react'

export default async function FornecedoresPage() {
  const supabase = createClient()
  const { data: fornecedores } = await supabase.from('fornecedores').select('*').order('nome')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Fornecedores</h1>
        <Link href="/admin/fornecedores/novo"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition-colors">
          <Plus size={18} /> Novo fornecedor
        </Link>
      </div>

      {(!fornecedores || fornecedores.length === 0) && (
        <div className="bg-zinc-900 rounded-2xl p-12 border border-zinc-800 text-center">
          <p className="text-zinc-400">Nenhum fornecedor cadastrado ainda.</p>
        </div>
      )}

      {fornecedores && fornecedores.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {fornecedores.map((f) => (
            <div key={f.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold">{f.nome}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.ativo ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {f.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  {f.contato && <span className="text-zinc-400 text-sm">{f.contato}</span>}
                  {f.telefone && (
                    <span className="text-zinc-400 text-sm flex items-center gap-1">
                      <Phone size={12} /> {f.telefone}
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/admin/fornecedores/${f.id}`}
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