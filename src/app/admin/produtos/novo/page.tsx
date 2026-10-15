import ProductForm from '@/components/admin/ProdutoForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewProductPage() {
  const supabase = createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Novo produto</h1>
      <ProductForm
        categories={categories ?? []}
        suppliers={suppliers ?? []}
      />
    </div>
  )
}