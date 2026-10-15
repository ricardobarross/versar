'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus, Upload, X } from 'lucide-react'
import type { Category, Supplier, Product, ProductVariation } from '@/types'
import { slugify } from '@/lib/slug'

type Props = {
  categories: Category[]
  suppliers: Supplier[]
  product?: Product & { product_variations?: ProductVariation[] }
}

type Variation = {
  id?: string
  color: string
  size: string
  stock: number
}

type PhotoPreview = {
  file?: File
  url: string
  id?: string
}

export default function ProductForm({ categories, suppliers, product }: Props) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [promoPrice, setPromoPrice] = useState(product?.promo_price?.toString() ?? '')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [supplierId, setSupplierId] = useState(product?.supplier_id ?? '')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false)

  const [photos, setPhotos] = useState<PhotoPreview[]>(
    [...(product?.product_images ?? [])]
      .sort((a, b) => a.order - b.order)
      .map(f => ({ url: f.url, id: f.id }))
  )

  const [variations, setVariations] = useState<Variation[]>(
    product?.product_variations?.map(v => ({
      id: v.id,
      color: v.color ?? '',
      size: v.size ?? '',
      stock: v.stock,
    })) ?? [{ color: '', size: '', stock: 0 }]
  )

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newPhotos = files.map(file => ({ file, url: URL.createObjectURL(file) }))
    setPhotos(prev => [...prev, ...newPhotos])
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  function addVariation() {
    setVariations(prev => [...prev, { color: '', size: '', stock: 0 }])
  }

  function removeVariation(index: number) {
    setVariations(prev => prev.filter((_, i) => i !== index))
  }

  function updateVariation(index: number, field: keyof Variation, value: string | number) {
    setVariations(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const preco = parseFloat(price.replace(',', '.'))
      const promo = promoPrice ? parseFloat(promoPrice.replace(',', '.')) : null
      if (!Number.isFinite(preco) || preco < 0) throw new Error('Preço inválido.')
      if (promo !== null && (!Number.isFinite(promo) || promo < 0 || promo >= preco)) {
        throw new Error('O preço promocional tem de ser menor que o preço normal.')
      }

      const productData = {
        name: name.trim(),
        description: description.trim() || null,
        price: preco,
        promo_price: promo,
        category_id: categoryId || null,
        supplier_id: supplierId || null,
        is_active: isActive,
        is_featured: isFeatured,
      }

      let productId = product?.id

      if (productId) {
        // o slug (endereço do produto) não muda ao editar, para não quebrar links
        const { error: updateError } = await supabase.from('products').update(productData).eq('id', productId)
        if (updateError) throw updateError
      } else {
        const base = slugify(name) || 'produto'
        let { data, error: insertError } = await supabase
          .from('products').insert({ ...productData, slug: base }).select('id').single()
        if (insertError?.code === '23505') {
          // já existe um produto com este endereço: acrescenta um sufixo curto
          ;({ data, error: insertError } = await supabase
            .from('products')
            .insert({ ...productData, slug: `${base}-${Math.random().toString(36).slice(2, 6)}` })
            .select('id')
            .single())
        }
        if (insertError || !data) throw insertError ?? new Error('Erro ao criar o produto.')
        productId = data.id
      }

      // Fotos: apaga as removidas, mantém a ordem da tela e envia as novas
      const keptImageIds = new Set(photos.filter(f => f.id).map(f => f.id))
      const removedImages = (product?.product_images ?? []).filter(img => !keptImageIds.has(img.id))
      if (removedImages.length > 0) {
        const { error: delError } = await supabase.from('product_images').delete().in('id', removedImages.map(i => i.id))
        if (delError) throw delError
        const paths = removedImages
          .map(img => img.url.split('/object/public/versar-photos/')[1])
          .filter((path): path is string => !!path)
        if (paths.length > 0) await supabase.storage.from('versar-photos').remove(paths)
      }

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        if (photo.id) {
          await supabase.from('product_images').update({ order: i, is_main: i === 0 }).eq('id', photo.id)
          continue
        }
        if (!photo.file) continue
        const ext = photo.file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `products/${productId}/${Date.now()}-${i}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('versar-photos').upload(path, photo.file, { contentType: photo.file.type })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('versar-photos').getPublicUrl(path)
        const { error: imgError } = await supabase.from('product_images').insert({
          product_id: productId,
          url: urlData.publicUrl,
          order: i,
          is_main: i === 0,
        })
        if (imgError) throw imgError
      }

      // Variações: atualiza as existentes, cria as novas e apaga só as removidas
      // (assim os pedidos antigos continuam ligados às variações)
      const validVariations = variations.filter(v => v.color.trim() || v.size.trim())
      const keptVariationIds = new Set(validVariations.filter(v => v.id).map(v => v.id))
      const removedVariationIds = (product?.product_variations ?? [])
        .map(v => v.id)
        .filter(id => !keptVariationIds.has(id))
      if (removedVariationIds.length > 0) {
        const { error: delVarError } = await supabase.from('product_variations').delete().in('id', removedVariationIds)
        if (delVarError) throw delVarError
      }

      for (const v of validVariations) {
        const row = {
          color: v.color.trim() || null,
          size: v.size.trim() || null,
          name: [v.color.trim(), v.size.trim()].filter(Boolean).join(' / ') || null,
          stock: Math.max(0, Math.trunc(v.stock || 0)),
        }
        const { error: varError } = v.id
          ? await supabase.from('product_variations').update(row).eq('id', v.id)
          : await supabase.from('product_variations').insert({ ...row, product_id: productId })
        if (varError) throw varError
      }

      router.push('/admin/produtos')
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar o produto.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Basic Information</h2>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Nome do produto *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="Ex: Slim Fit Shirt" />
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Descrição</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none resize-none"
            placeholder="Descreva o produto..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Preço (R$) *</label>
            <input type="number" step="0.01" min="0" value={price}
              onChange={e => setPrice(e.target.value)} required
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="0.00" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Preço promocional (R$)</label>
            <input type="number" step="0.01" min="0" value={promoPrice}
              onChange={e => setPromoPrice(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="0.00" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Categoria</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
              <option value="">Sem categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Fornecedor</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
              <option value="">Sem fornecedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="text-zinc-300 text-sm">Ativo (visível na loja)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="text-zinc-300 text-sm">Produto em destaque</span>
          </label>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Fotos do produto</h2>

        <div className="grid grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                <X size={12} />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}

          <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors">
            <Upload size={20} className="text-zinc-500 mb-1" />
            <span className="text-zinc-500 text-xs">Adicionar</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>
        <p className="text-zinc-500 text-xs">A primeira foto será a imagem principal do produto.</p>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Variações e estoque</h2>
          <button type="button" onClick={addVariation}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <Plus size={16} /> Adicionar variação
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-xs text-zinc-500 px-1">
            <span className="col-span-4">Cor</span>
            <span className="col-span-4">Tamanho</span>
            <span className="col-span-3">Estoque</span>
          </div>

          {variations.map((v, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <input type="text" value={v.color}
                onChange={e => updateVariation(index, 'color', e.target.value)}
                placeholder="Ex: Preto"
                className="col-span-4 bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-white focus:outline-none text-sm" />
              <input type="text" value={v.size}
                onChange={e => updateVariation(index, 'size', e.target.value)}
                placeholder="Ex: M"
                className="col-span-4 bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-white focus:outline-none text-sm" />
              <input type="number" min="0" value={v.stock}
                onChange={e => updateVariation(index, 'stock', parseInt(e.target.value) || 0)}
                className="col-span-3 bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-white focus:outline-none text-sm" />
              <button type="button" onClick={() => removeVariation(index)}
                className="col-span-1 text-zinc-600 hover:text-red-400 transition-colors flex justify-center">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {loading ? 'Salvando...' : product ? 'Salvar alterações' : 'Criar produto'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-zinc-400 px-8 py-3 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}