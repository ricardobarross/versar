'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [configId, setConfigId] = useState('')

  const [storeName, setStoreName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerSubtitle, setBannerSubtitle] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    setLoading(true)
    supabase.from('store_settings').select('*').single()
      .then(({ data }) => {
        if (data) {
          setConfigId(data.id)
          setStoreName(data.store_name ?? '')
          setWhatsapp(data.whatsapp ?? '')
          setBannerTitle(data.banner_title ?? '')
          setBannerSubtitle(data.banner_subtitle ?? '')
          setInstagram(data.instagram ?? '')
          setFacebook(data.facebook ?? '')
          setLogoUrl(data.logo_url ?? '')
        }
        setLoading(false)
      })
  }, [])

  async function handleUpload(file: File) {
    const ext = file.name.split('.').pop()
    const path = `logo/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('versar-fotos').upload(path, file, { upsert: true })
    if (uploadError) { setError(uploadError.message); return }
    const { data } = supabase.storage.from('versar-fotos').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const payload = {
      store_name: storeName,
      whatsapp,
      banner_title: bannerTitle,
      banner_subtitle: bannerSubtitle,
      instagram,
      facebook,
    }

    const { error: err } = configId
      ? await supabase.from('store_settings').update(payload).eq('id', configId)
      : await supabase.from('store_settings').insert(payload)

    if (err) { setError(err.message); setSaving(false); return }
    setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return <div className="text-zinc-400">Loading...</div>

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Store Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 max-w-2xl">

        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <h2 className="text-white font-semibold">Store Identity</h2>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Store name</label>
            <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="VERSAR" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Logo</label>
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-16 mb-3 rounded object-contain bg-zinc-800 p-2" />
            )}
            <label className="flex items-center gap-2 cursor-pointer w-fit bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
              <Upload size={16} /> Upload logo
              <input type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <h2 className="text-white font-semibold">Contact & Social Media</h2>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">WhatsApp (with country code)</label>
            <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="+5581996455218" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Instagram</label>
              <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
                placeholder="@versar" />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Facebook</label>
              <input type="text" value={facebook} onChange={e => setFacebook(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
                placeholder="facebook.com/versar" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <h2 className="text-white font-semibold">Store Banner</h2>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Banner title</label>
            <input type="text" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="Quality menswear" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Banner subtitle</label>
            <input type="text" value={bannerSubtitle} onChange={e => setBannerSubtitle(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="Style that makes a difference" />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{error}</p>}
        {success && <p className="text-green-400 text-sm bg-green-950 rounded-lg px-4 py-3">Settings saved successfully!</p>}

        <button type="submit" disabled={saving}
          className="w-full sm:w-auto bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}