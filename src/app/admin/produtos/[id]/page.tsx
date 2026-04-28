import { createClient } from '@/lib/supabase/server'
import ProdutoForm from '@/components/admin/ProdutoForm'
import { notFound } from 'next/navigation'

export default async function EditarProdutoPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: produto } = await supabase
    .from('produtos')
    .select(`*, produto_fotos(*), produto_variacoes(*)`)
    .eq('id', params.id)
    .single()

  if (!produto) notFound()

  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  const { data: fornecedores } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Editar Produto</h1>
      <ProdutoForm
        produto={produto}
        categorias={categorias ?? []}
        fornecedores={fornecedores ?? []}
      />
    </div>
  )
}