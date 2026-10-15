import type { MetadataRoute } from 'next'
import { createPublicClient, siteUrl } from '@/lib/site'

export const revalidate = 3600 // atualiza no máximo de hora a hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const paginas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/produtos`, changeFrequency: 'daily', priority: 0.9 },
  ]

  try {
    const supabase = createPublicClient()
    const [{ data: produtos }, { data: categorias }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_active', true).not('slug', 'is', null),
      supabase.from('categories').select('slug').eq('is_active', true),
    ])
    for (const c of categorias ?? []) {
      paginas.push({ url: `${base}/categoria/${c.slug}`, changeFrequency: 'weekly', priority: 0.7 })
    }
    for (const p of produtos ?? []) {
      paginas.push({ url: `${base}/produtos/${p.slug}`, lastModified: p.updated_at, changeFrequency: 'weekly', priority: 0.8 })
    }
  } catch (err) {
    console.error('[sitemap]', err)
  }

  return paginas
}
