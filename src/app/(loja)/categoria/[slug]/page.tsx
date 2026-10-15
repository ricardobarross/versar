import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', slug)
    .single()

  return { title: category?.name ?? 'Category' }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const supabase = createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!category) notFound()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(`id, name, slug, price, promo_price, is_featured, product_images (url, order)`)
      .eq('is_active', true)
      .eq('category_id', category.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name'),
  ])

  const lista = products ?? []
  const cats = categories ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap">
        <Link href="/" className="hover:text-zinc-700 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-zinc-700 transition-colors">Products</Link>
        <span>/</span>
        <span className="text-zinc-700 font-medium">{category.name}</span>
      </nav>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{category.name}</h1>
        <p className="text-zinc-500 mt-1 text-sm">{lista.length} product{lista.length !== 1 ? 's' : ''}</p>
      </div>

      {cats.length > 0 && (
        <div className="flex gap-2 mb-6 sm:mb-8 pb-6 border-b border-zinc-200 overflow-x-auto scrollbar-hide">
          <Link href="/produtos"
            className="flex-shrink-0 px-4 py-2 text-sm font-medium border border-zinc-300 text-zinc-600 hover:border-zinc-900 transition-colors">
            All
          </Link>
          {cats.map(cat => (
            <Link key={cat.id} href={`/categoria/${cat.slug}`}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium border transition-colors ${
                cat.slug === slug
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-300 text-zinc-600 hover:border-zinc-900'
              }`}>
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {lista.length === 0 && (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-xl font-medium">No products in this category</p>
          <Link href="/produtos" className="mt-4 inline-block text-sm text-zinc-600 underline hover:text-zinc-900">
            View all products
          </Link>
        </div>
      )}

      {lista.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {lista.map(product => {
            const images = (product.product_images as any[]) ?? []
            const photo = images.sort((a, b) => a.order - b.order)[0]?.url ?? null
            const hasPromo = product.promo_price && product.promo_price < product.price

            return (
              <Link key={product.id} href={`/produtos/${product.slug}`} className="group">
                <div className="aspect-[3/4] bg-zinc-100 overflow-hidden mb-3 relative">
                  {photo ? (
                    <Image src={photo} alt={product.name} width={400} height={533}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {hasPromo && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5">SALE</div>
                  )}
                </div>
                <h3 className="font-medium text-zinc-900 text-sm line-clamp-2">{product.name}</h3>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  {hasPromo ? (
                    <>
                      <span className="font-bold text-red-600 text-sm">R$ {Number(product.promo_price).toFixed(2).replace('.', ',')}</span>
                      <span className="text-xs text-zinc-400 line-through">R$ {Number(product.price).toFixed(2).replace('.', ',')}</span>
                    </>
                  ) : (
                    <span className="font-bold text-zinc-900 text-sm">R$ {Number(product.price).toFixed(2).replace('.', ',')}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}