'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, X } from 'lucide-react'

type Config = {
  store_name: string
  whatsapp: string
  banner_title: string
  banner_subtitle: string
  banner_url: string
  logo_url: string
  instagram: string
  facebook: string
}

const VAZIO: Config = {
  store_name: '', whatsapp: '', banner_title: '', banner_subtitle: '',
  banner_url: '', logo_url: '', instagram: '', facebook: '',
}

const input = 'w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none'

export default function ConfiguracoesPage() {
  const [supabase] = useState(() => createClient())
  const [config, setConfig] = useState<Config>(VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState<'logo_url' | 'banner_url' | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase.from('store_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) {
        setConfig({
          store_name: data.store_name ?? '',
          whatsapp: data.whatsapp ?? '',
          banner_title: data.banner_title ?? '',
          banner_subtitle: data.banner_subtitle ?? '',
          banner_url: data.banner_url ?? '',
          logo_url: data.logo_url ?? '',
          instagram: data.instagram ?? '',
          facebook: data.facebook ?? '',
        })
      }
      setCarregando(false)
    })
  }, [supabase])

  const set = (campo: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig(c => ({ ...c, [campo]: e.target.value }))

  async function enviarImagem(campo: 'logo_url' | 'banner_url', file: File) {
    if (!file.type.startsWith('image/')) return setErro('Escolha um arquivo de imagem.')
    if (file.size > 5 * 1024 * 1024) return setErro('Imagem muito grande (máximo 5 MB).')
    setErro('')
    setEnviando(campo)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `loja/${campo === 'logo_url' ? 'logo' : 'banner'}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('versar-fotos').upload(path, file, { upsert: true, contentType: file.type })
    setEnviando(null)
    if (error) return setErro(error.message)
    const { data } = supabase.storage.from('versar-fotos').getPublicUrl(path)
    setConfig(c => ({ ...c, [campo]: data.publicUrl }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    setSucesso(false)

    const payload = {
      id: 1,
      store_name: config.store_name.trim() || 'VERSAR',
      whatsapp: config.whatsapp.replace(/[^\d+]/g, '') || null,
      banner_title: config.banner_title.trim() || null,
      banner_subtitle: config.banner_subtitle.trim() || null,
      banner_url: config.banner_url || null,
      logo_url: config.logo_url || null,
      instagram: config.instagram.trim() || null,
      facebook: config.facebook.trim() || null,
    }

    const { error } = await supabase.from('store_settings').upsert(payload)
    setSalvando(false)
    if (error) return setErro(error.message)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
  }

  if (carregando) return <div className="text-zinc-400">Carregando...</div>

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Configurações da loja</h1>

      <form onSubmit={salvar} className="space-y-4 sm:space-y-6 max-w-2xl">
        <section className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <h2 className="text-white font-semibold">Identidade</h2>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Nome da loja</label>
            <input type="text" value={config.store_name} onChange={set('store_name')} className={input} placeholder="VERSAR" />
          </div>
          <ImagemCampo
            rotulo="Logotipo"
            dica="Aparece no topo da loja no lugar do nome. PNG com fundo transparente fica melhor."
            url={config.logo_url}
            enviando={enviando === 'logo_url'}
            onEscolher={f => enviarImagem('logo_url', f)}
            onRemover={() => setConfig(c => ({ ...c, logo_url: '' }))}
            altura="h-16"
          />
        </section>

        <section className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <h2 className="text-white font-semibold">Banner da página inicial</h2>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Título</label>
            <input type="text" value={config.banner_title} onChange={set('banner_title')} className={input} placeholder="Nova coleção" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Subtítulo</label>
            <input type="text" value={config.banner_subtitle} onChange={set('banner_subtitle')} className={input} placeholder="Moda masculina com atitude" />
          </div>
          <ImagemCampo
            rotulo="Imagem de fundo"
            dica="Recomendado: 1920×1080 px. Sem imagem, o banner fica preto."
            url={config.banner_url}
            enviando={enviando === 'banner_url'}
            onEscolher={f => enviarImagem('banner_url', f)}
            onRemover={() => setConfig(c => ({ ...c, banner_url: '' }))}
            altura="h-32"
          />
        </section>

        <section className="bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <h2 className="text-white font-semibold">Contato e redes sociais</h2>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">WhatsApp (com DDI e DDD)</label>
            <input type="tel" value={config.whatsapp} onChange={set('whatsapp')} className={input} placeholder="+55 81 99999-9999" />
            <p className="text-zinc-500 text-xs mt-1">Os pedidos da loja são enviados para este número.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Instagram</label>
              <input type="text" value={config.instagram} onChange={set('instagram')} className={input} placeholder="@versar" />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Facebook</label>
              <input type="text" value={config.facebook} onChange={set('facebook')} className={input} placeholder="facebook.com/versar" />
            </div>
          </div>
        </section>

        {erro && <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{erro}</p>}
        {sucesso && <p className="text-green-400 text-sm bg-green-950 rounded-lg px-4 py-3">Configurações salvas!</p>}

        <button type="submit" disabled={salvando || enviando !== null}
          className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {salvando ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}

function ImagemCampo(props: {
  rotulo: string
  dica: string
  url: string
  enviando: boolean
  altura: string
  onEscolher: (f: File) => void
  onRemover: () => void
}) {
  return (
    <div>
      <label className="block text-zinc-400 text-sm mb-2">{props.rotulo}</label>
      {props.url && (
        <div className="relative w-fit mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={props.url} alt={props.rotulo} className={`${props.altura} rounded object-contain bg-zinc-800 p-2`} />
          <button type="button" onClick={props.onRemover} aria-label="Remover imagem"
            className="absolute -top-2 -right-2 bg-zinc-700 hover:bg-red-600 text-white rounded-full p-1">
            <X size={12} />
          </button>
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer w-fit bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
        {props.enviando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {props.enviando ? 'Enviando...' : props.url ? 'Trocar imagem' : 'Enviar imagem'}
        <input type="file" accept="image/*" className="hidden" disabled={props.enviando}
          onChange={e => { const f = e.target.files?.[0]; if (f) props.onEscolher(f); e.target.value = '' }} />
      </label>
      <p className="text-zinc-500 text-xs mt-1">{props.dica}</p>
    </div>
  )
}
