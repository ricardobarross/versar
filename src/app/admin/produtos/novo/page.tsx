import ProdutoForm from '@/components/admin/ProdutoForm'
import { createClient } from '@/lib/supabase/server'

export default async function NovoProdutoPage() {
  const supabase = createClient()
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
      <h1 className="text-2xl font-bold text-white mb-8">Novo Produto</h1>
      <ProdutoForm
        categorias={categorias ?? []}
        fornecedores={fornecedores ?? []}
      />
    </div>
  )
}