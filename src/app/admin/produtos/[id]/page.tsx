import { createClient } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/ProdutoForm'
import { notFound } from 'next/navigation'

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: product } = await supabase
    .from('products')
    .select(`*, product_images(*), product_variations(*)`)
    .eq('id', params.id)
    .single()

  if (!product) notFound()

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
      <h1 className="text-2xl font-bold text-white mb-8">Edit Product</h1>
      <ProductForm
        product={product}
        categories={categories ?? []}
        suppliers={suppliers ?? []}
      />
    </div>
  )
}