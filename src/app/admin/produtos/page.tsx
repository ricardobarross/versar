import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil, Eye, EyeOff } from 'lucide-react'

export default async function ProdutosPage() {
  const supabase = createClient()

  const { data: produtos } = await supabase
    .from('produtos')
    .select(`
      *,
      produto_fotos (url, ordem),
      produto_variacoes (estoque),
      categorias (nome)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
        >
          <Plus size={18} />
          Novo produto
        </Link>
      </div>

      {produtos && produtos.length === 0 && (
        <div className="bg-zinc-900 rounded-2xl p-12 border border-zinc-800 text-center">
          <p className="text-zinc-400">Nenhum produto cadastrado ainda.</p>
          <Link
            href="/admin/produtos/novo"
            className="inline-flex items-center gap-2 mt-4 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Plus size={18} />
            Cadastrar primeiro produto
          </Link>
        </div>
      )}

      {produtos && produtos.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {produtos.map((produto) => {
            const foto = produto.produto_fotos
              ?.sort((a: any, b: any) => a.ordem - b.ordem)[0]
            const estoqueTotal = produto.produto_variacoes
              ?.reduce((acc: number, v: any) => acc + v.estoque, 0) ?? 0

            return (
              <div
                key={produto.id}
                className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex items-center gap-4"
              >
                {/* Foto */}
                <div className="w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                  {foto ? (
                    <img
                      src={foto.url}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      Sem foto
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold truncate">{produto.nome}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      produto.ativo
                        ? 'bg-green-900 text-green-400'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {produto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    {produto.destaque && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-400">
                        Destaque
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm mt-0.5">
                    {produto.categorias?.nome ?? 'Sem categoria'}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-white font-bold">
                      R$ {produto.preco.toFixed(2).replace('.', ',')}
                    </span>
                    {produto.preco_promocional && (
                      <span className="text-green-400 text-sm">
                        Promo: R$ {produto.preco_promocional.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <span className={`text-sm ${estoqueTotal === 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                      Estoque: {estoqueTotal}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                  <ToggleAtivoButton id={produto.id} ativo={produto.ativo} />
                  <Link
                    href={`/admin/produtos/${produto.id}`}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ToggleAtivoButton({ id, ativo }: { id: string; ativo: boolean }) {
  return (
    <form action={`/api/produtos/${id}/toggle`} method="POST">
      <button
        type="submit"
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        title={ativo ? 'Desativar' : 'Ativar'}
      >
        {ativo ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </form>
  )
}