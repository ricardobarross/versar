'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload } from 'lucide-react'

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [configId, setConfigId] = useState('')

  const [nomeLoja, setNomeLoja] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [bannerTitulo, setBannerTitulo] = useState('')
  const [bannerSubtitulo, setBannerSubtitulo] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  useEffect(() => {
    setLoading(true)
    supabase.from('configuracoes_loja').select('*').single()
      .then(({ data }) => {
        if (data) {
          setConfigId(data.id)
          setNomeLoja(data.nome_loja ?? '')
          setWhatsapp(data.whatsapp ?? '')
          setBannerTitulo(data.banner_titulo ?? '')
          setBannerSubtitulo(data.banner_subtitulo ?? '')
          setInstagram(data.instagram ?? '')
          setFacebook(data.facebook ?? '')
          setLogoUrl(data.logo_url ?? '')
          setBannerUrl(data.banner_url ?? '')
        }
        setLoading(false)
      })
  }, [])

  async function handleUpload(file: File, tipo: 'logo' | 'banner') {
    const ext = file.name.split('.').pop()
    const path = `${tipo}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('versar-fotos').upload(path, file, { upsert: true })
    if (error) { setErro(error.message); return }
    const { data } = supabase.storage.from('versar-fotos').getPublicUrl(path)
    if (tipo === 'logo') setLogoUrl(data.publicUrl)
    else setBannerUrl(data.publicUrl)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    setSucesso(false)

    const dados = {
      nome_loja: nomeLoja,
      whatsapp,
      banner_titulo: bannerTitulo,
      banner_subtitulo: bannerSubtitulo,
      instagram,
      facebook,
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
    }

    const { error } = configId
      ? await supabase.from('configuracoes_loja').update(dados).eq('id', configId)
      : await supabase.from('configuracoes_loja').insert(dados)

    if (error) { setErro(error.message); setSalvando(false); return }
    setSucesso(true)
    setSalvando(false)
    setTimeout(() => setSucesso(false), 3000)
  }

  if (loading) return <div className="text-zinc-400">Carregando...</div>

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Configurações da loja</h1>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 max-w-2xl">

        {/* Identidade */}
        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <h2 className="text-white font-semibold">Identidade da loja</h2>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Nome da loja</label>
            <input
              type="text" value={nomeLoja} onChange={e => setNomeLoja(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="VERSAR"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Logo</label>
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-16 mb-3 rounded object-contain bg-zinc-800 p-2" />
            )}
            <label className="flex items-center gap-2 cursor-pointer w-fit bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
              <Upload size={16} /> Fazer upload do logo
              <input type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')} />
            </label>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <h2 className="text-white font-semibold">Contato e redes sociais</h2>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">WhatsApp (com código do país)</label>
            <input
              type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="+5581996455218"
            />
          </div>
          {/* Instagram e Facebook — 1 coluna mobile, 2 desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Instagram</label>
              <input
                type="text" value={instagram} onChange={e => setInstagram(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
                placeholder="@versar"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Facebook</label>
              <input
                type="text" value={facebook} onChange={e => setFacebook(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
                placeholder="facebook.com/versar"
              />
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <h2 className="text-white font-semibold">Banner da loja</h2>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Título do banner</label>
            <input
              type="text" value={bannerTitulo} onChange={e => setBannerTitulo(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="Moda masculina de qualidade"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Subtítulo do banner</label>
            <input
              type="text" value={bannerSubtitulo} onChange={e => setBannerSubtitulo(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="Estilo que faz a diferença"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Imagem do banner</label>
            {bannerUrl && (
              <img src={bannerUrl} alt="Banner" className="w-full h-32 mb-3 rounded object-cover" />
            )}
            <label className="flex items-center gap-2 cursor-pointer w-fit bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
              <Upload size={16} /> Fazer upload do banner
              <input type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'banner')} />
            </label>
          </div>
        </div>

        {erro && (
          <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{erro}</p>
        )}
        {sucesso && (
          <p className="text-green-400 text-sm bg-green-950 rounded-lg px-4 py-3">
            Configurações salvas com sucesso!
          </p>
        )}

        <button
          type="submit" disabled={salvando}
          className="w-full sm:w-auto bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}