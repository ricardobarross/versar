export type Produto = {
  id: string
  nome: string
  descricao: string | null
  preco: number
  preco_promocional: number | null
  categoria_id: string | null
  fornecedor_id: string | null
  ativo: boolean
  destaque: boolean
  slug: string | null
  created_at: string
  updated_at: string
  produto_fotos?: ProdutoFoto[]
  produto_variacoes?: ProdutoVariacao[]
  categorias?: Categoria
}

export type ProdutoFoto = {
  id: string
  produto_id: string
  url: string
  ordem: number
}

export type ProdutoVariacao = {
  id: string
  produto_id: string
  cor: string | null
  tamanho: string | null
  estoque: number
}

export type Categoria = {
  id: string
  nome: string
  slug: string
  ativo: boolean
}

export type Cliente = {
  id: string
  nome: string
  whatsapp: string | null
  email: string | null
  cpf: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  notas: string | null
  created_at: string
}

export type Fornecedor = {
  id: string
  nome: string
  contato: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  notas: string | null
  ativo: boolean
  created_at: string
}

export type Pedido = {
  id: string
  numero: number
  cliente_id: string | null
  status: 'novo' | 'confirmado' | 'separando' | 'enviado' | 'entregue' | 'cancelado'
  total: number
  forma_pagamento: string | null
  observacoes: string | null
  origem: string
  created_at: string
  clientes?: Cliente
  pedido_itens?: PedidoItem[]
}

export type PedidoItem = {
  id: string
  pedido_id: string
  produto_id: string
  variacao_id: string | null
  quantidade: number
  preco_unitario: number
  produtos?: Produto
}

export type ConfiguracoesLoja = {
  id: string
  nome_loja: string
  whatsapp: string
  logo_url: string | null
  banner_url: string | null
  banner_titulo: string | null
  banner_subtitulo: string | null
  cor_primaria: string
  instagram: string | null
  facebook: string | null
}