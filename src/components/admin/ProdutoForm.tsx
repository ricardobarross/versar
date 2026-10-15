'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus, Upload, X } from 'lucide-react'
import type { Category, Supplier, Product, ProductVariation } from '@/types'

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
  const supabase = createClient()
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
    product?.product_images?.map((f: any) => ({ url: f.url, id: f.id })) ?? []
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
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now()

      let productId = product?.id

      const productData = {
        name,
        description,
        slug,
        price: parseFloat(price),
        promo_price: promoPrice ? parseFloat(promoPrice) : null,
        category_id: categoryId || null,
        supplier_id: supplierId || null,
        is_active: isActive,
        is_featured: isFeatured,
      }

      if (productId) {
        await supabase.from('products').update(productData).eq('id', productId)
      } else {
        const { data, error: insertError } = await supabase
          .from('products').insert(productData).select().single()
        if (insertError) throw insertError
        productId = data.id
      }

      // Upload new photos
      const newPhotos = photos.filter(f => f.file)
      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i]
        if (!photo.file) continue
        const ext = photo.file.name.split('.').pop()
        const path = `products/${productId}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('versar-photos').upload(path, photo.file)
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('versar-photos').getPublicUrl(path)

        await supabase.from('product_images').insert({
          product_id: productId,
          url: urlData.publicUrl,
          order: i,
        })
      }

      // Save variations
      if (product?.id) {
        await supabase.from('product_variations').delete().eq('product_id', productId)
      }

      const validVariations = variations.filter(v => v.color || v.size)
      if (validVariations.length > 0) {
        await supabase.from('product_variations').insert(
          validVariations.map(v => ({
            product_id: productId,
            color: v.color || null,
            size: v.size || null,
            stock: v.stock,
          }))
        )
      }

      router.push('/admin/produtos')
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Error saving product.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Basic Information</h2>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Product name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="Ex: Slim Fit Shirt" />
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none resize-none"
            placeholder="Describe the product..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Price (R$) *</label>
            <input type="number" step="0.01" min="0" value={price}
              onChange={e => setPrice(e.target.value)} required
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="0.00" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Promo price (R$)</label>
            <input type="number" step="0.01" min="0" value={promoPrice}
              onChange={e => setPromoPrice(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="0.00" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Category</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
              <option value="">No category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Supplier</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none">
              <option value="">No supplier</option>
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
            <span className="text-zinc-300 text-sm">Active (visible in store)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="text-zinc-300 text-sm">Featured product</span>
          </label>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Product Photos</h2>

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
                  Main
                </span>
              )}
            </div>
          ))}

          <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors">
            <Upload size={20} className="text-zinc-500 mb-1" />
            <span className="text-zinc-500 text-xs">Add</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>
        <p className="text-zinc-500 text-xs">The first photo will be the main product image.</p>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Variations & Stock</h2>
          <button type="button" onClick={addVariation}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <Plus size={16} /> Add variation
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-xs text-zinc-500 px-1">
            <span className="col-span-4">Color</span>
            <span className="col-span-4">Size</span>
            <span className="col-span-3">Stock</span>
          </div>

          {variations.map((v, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <input type="text" value={v.color}
                onChange={e => updateVariation(index, 'color', e.target.value)}
                placeholder="Ex: Black"
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
          {loading ? 'Saving...' : product ? 'Save changes' : 'Create product'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-zinc-400 px-8 py-3 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}