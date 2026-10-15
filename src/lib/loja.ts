/**
 * Consultas da loja pública.
 *
 * As tabelas estão em inglês (products, product_images…), mas os
 * componentes da loja usam nomes em português. Em vez de manter views,
 * pedimos ao Supabase para devolver as colunas já renomeadas
 * (sintaxe `alias:coluna`). Os tipos abaixo descrevem esse formato.
 */

export type FotoLoja = { id?: string; url: string; ordem: number; principal?: boolean }
export type VariacaoLoja = { id?: string; cor?: string | null; tamanho?: string | null; estoque: number }
export type CategoriaLoja = { id: string; nome: string; slug: string }

export type ProdutoLoja = {
  id: string
  slug: string
  nome: string
  descricao?: string | null
  preco: number
  preco_promocional: number | null
  destaque: boolean
  ativo?: boolean
  produto_fotos: FotoLoja[]
  produto_variacoes: VariacaoLoja[]
  categorias?: CategoriaLoja | null
}

export type ConfigLoja = {
  id: number
  nome_loja: string
  whatsapp: string | null
  banner_titulo: string | null
  banner_subtitulo: string | null
  banner_url: string | null
  logo_url: string | null
  instagram: string | null
  facebook: string | null
}

/** Campos para os cartões de produto (listagens). */
export const PRODUTO_CARD_SELECT = `
  id, slug,
  nome:name,
  preco:price,
  preco_promocional:promo_price,
  destaque:is_featured,
  produto_fotos:product_images(url, ordem:order),
  produto_variacoes:product_variations(estoque:stock)
`

/** Campos para a página de detalhe do produto. */
export const PRODUTO_DETALHE_SELECT = `
  id, slug,
  nome:name,
  descricao:description,
  preco:price,
  preco_promocional:promo_price,
  destaque:is_featured,
  ativo:is_active,
  categorias:categories(id, nome:name, slug),
  produto_fotos:product_images(id, url, ordem:order, principal:is_main),
  produto_variacoes:product_variations(id, cor:color, tamanho:size, estoque:stock)
`

export const CATEGORIA_SELECT = 'id, nome:name, slug'

export const CONFIG_SELECT = `
  id,
  nome_loja:store_name,
  whatsapp,
  banner_titulo:banner_title,
  banner_subtitulo:banner_subtitle,
  banner_url, logo_url, instagram, facebook
`

/** numeric do Postgres chega como string; normaliza para number. */
export function normalizarProduto<T extends { preco: unknown; preco_promocional: unknown }>(p: T) {
  return {
    ...p,
    preco: Number(p.preco),
    preco_promocional: p.preco_promocional == null ? null : Number(p.preco_promocional),
  }
}
