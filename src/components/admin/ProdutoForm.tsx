'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus, Upload, X } from 'lucide-react'
import type { Categoria, Fornecedor, Produto, ProdutoVariacao } from '@/types'

type Props = {
  categorias: Categoria[]
  fornecedores: Fornecedor[]
  produto?: Produto & { produto_variacoes?: ProdutoVariacao[] }
}

type Variacao = {
  id?: string
  cor: string
  tamanho: string
  estoque: number
}

type FotoPreview = {
  file?: File
  url: string
  id?: string
}

export default function ProdutoForm({ categorias, fornecedores, produto }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  // Campos principais
  const [nome, setNome] = useState(produto?.nome ?? '')
  const [descricao, setDescricao] = useState(produto?.descricao ?? '')
  const [preco, setPreco] = useState(produto?.preco?.toString() ?? '')
  const [precoPromocional, setPrecoPromocional] = useState(
    produto?.preco_promocional?.toString() ?? ''
  )
  const [categoriaId, setCategoriaId] = useState(produto?.categoria_id ?? '')
  const [fornecedorId, setFornecedorId] = useState(produto?.fornecedor_id ?? '')
  const [ativo, setAtivo] = useState(produto?.ativo ?? true)
  const [destaque, setDestaque] = useState(produto?.destaque ?? false)

  // Fotos
  const [fotos, setFotos] = useState<FotoPreview[]>(
    produto?.produto_fotos?.map(f => ({ url: f.url, id: f.id })) ?? []
  )

  // Variações
  const [variacoes, setVariacoes] = useState<Variacao[]>(
    produto?.produto_variacoes?.map(v => ({
      id: v.id,
      cor: v.cor ?? '',
      tamanho: v.tamanho ?? '',
      estoque: v.estoque,
    })) ?? [{ cor: '', tamanho: '', estoque: 0 }]
  )

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const novas = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setFotos(prev => [...prev, ...novas])
  }

  function removerFoto(index: number) {
    setFotos(prev => prev.filter((_, i) => i !== index))
  }

  function adicionarVariacao() {
    setVariacoes(prev => [...prev, { cor: '', tamanho: '', estoque: 0 }])
  }

  function removerVariacao(index: number) {
    setVariacoes(prev => prev.filter((_, i) => i !== index))
  }

  function atualizarVariacao(index: number, campo: keyof Variacao, valor: string | number) {
    setVariacoes(prev => prev.map((v, i) => i === index ? { ...v, [campo]: valor } : v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      // Gerar slug
      const slug = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now()

      // 1. Criar ou atualizar o produto
      let produtoId = produto?.id

      if (produtoId) {
        await supabase.from('produtos').update({
          nome, descricao, slug,
          preco: parseFloat(preco),
          preco_promocional: precoPromocional ? parseFloat(precoPromocional) : null,
          categoria_id: categoriaId || null,
          fornecedor_id: fornecedorId || null,
          ativo, destaque,
        }).eq('id', produtoId)
      } else {
        const { data, error } = await supabase.from('produtos').insert({
          nome, descricao, slug,
          preco: parseFloat(preco),
          preco_promocional: precoPromocional ? parseFloat(precoPromocional) : null,
          categoria_id: categoriaId || null,
          fornecedor_id: fornecedorId || null,
          ativo, destaque,
        }).select().single()

        if (error) throw error
        produtoId = data.id
      }

      // 2. Upload das fotos novas
      const fotosNovas = fotos.filter(f => f.file)
      for (let i = 0; i < fotosNovas.length; i++) {
        const foto = fotosNovas[i]
        if (!foto.file) continue

        const ext = foto.file.name.split('.').pop()
        const path = `produtos/${produtoId}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('versar-fotos')
          .upload(path, foto.file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('versar-fotos')
          .getPublicUrl(path)

        await supabase.from('produto_fotos').insert({
          produto_id: produtoId,
          url: urlData.publicUrl,
          ordem: i,
        })
      }

      // 3. Salvar variações
      if (produto?.id) {
        await supabase.from('produto_variacoes').delete().eq('produto_id', produtoId)
      }

      const variacoesValidas = variacoes.filter(v => v.cor || v.tamanho)
      if (variacoesValidas.length > 0) {
        await supabase.from('produto_variacoes').insert(
          variacoesValidas.map(v => ({
            produto_id: produtoId,
            cor: v.cor || null,
            tamanho: v.tamanho || null,
            estoque: v.estoque,
          }))
        )
      }

      router.push('/admin/produtos')
      router.refresh()
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao salvar produto.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {/* Informações básicas */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Informações básicas</h2>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Nome do produto *</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            placeholder="Ex: Camisa Social Slim"
          />
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Descrição</label>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            rows={3}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none resize-none"
            placeholder="Descreva o produto..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Preço (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={preco}
              onChange={e => setPreco(e.target.value)}
              required
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Preço promocional (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={precoPromocional}
              onChange={e => setPrecoPromocional(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Categoria</label>
            <select
              value={categoriaId}
              onChange={e => setCategoriaId(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            >
              <option value="">Sem categoria</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Fornecedor</label>
            <select
              value={fornecedorId}
              onChange={e => setFornecedorId(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none"
            >
              <option value="">Sem fornecedor</option>
              {fornecedores.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ativo}
              onChange={e => setAtivo(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-zinc-300 text-sm">Produto ativo (visível na loja)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={destaque}
              onChange={e => setDestaque(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-zinc-300 text-sm">Produto em destaque</span>
          </label>
        </div>
      </div>

      {/* Fotos */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <h2 className="text-white font-semibold">Fotos do produto</h2>

        <div className="grid grid-cols-4 gap-3">
          {fotos.map((foto, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
              <img src={foto.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removerFoto(index)}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
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
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFotoChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-zinc-500 text-xs">A primeira foto será a imagem principal do produto.</p>
      </div>

      {/* Variações */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Variações e estoque</h2>
          <button
            type="button"
            onClick={adicionarVariacao}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <Plus size={16} />
            Adicionar variação
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-xs text-zinc-500 px-1">
            <span className="col-span-4">Cor</span>
            <span className="col-span-4">Tamanho</span>
            <span className="col-span-3">Estoque</span>
          </div>

          {variacoes.map((v, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <input
                type="text"
                value={v.cor}
                onChange={e => atualizarVariacao(index, 'cor', e.target.value)}
                placeholder="Ex: Preto"
                className="col-span-4 bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-white focus:outline-none text-sm"
              />
              <input
                type="text"
                value={v.tamanho}
                onChange={e => atualizarVariacao(index, 'tamanho', e.target.value)}
                placeholder="Ex: M"
                className="col-span-4 bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-white focus:outline-none text-sm"
              />
              <input
                type="number"
                min="0"
                value={v.estoque}
                onChange={e => atualizarVariacao(index, 'estoque', parseInt(e.target.value) || 0)}
                className="col-span-3 bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-white focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => removerVariacao(index)}
                className="col-span-1 text-zinc-600 hover:text-red-400 transition-colors flex justify-center"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {erro && (
        <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{erro}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : produto ? 'Salvar alterações' : 'Cadastrar produto'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-zinc-400 px-8 py-3 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}