import { createClient } from '@/lib/supabase/server'
import ProdutoCard from '@/components/loja/ProdutoCard'

export const dynamic = 'force-dynamic'

export default async function LojaPage() {
  const supabase = createClient()

  const [{ data: config }, { data: produtos }, { data: categorias }] = await Promise.all([
    supabase.from('configuracoes_loja').select('*').maybeSingle(),
    supabase.from('produtos')
      .select('*, produto_fotos(*), produto_variacoes(*), categorias(nome)')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categorias').select('*').eq('ativo', true).order('nome'),
  ])

  const destaques = produtos?.filter(p => p.destaque) ?? []

  return (
    <div>
      {/* Banner */}
      <section
        className="relative h-[60vh] sm:h-[70vh] flex items-center justify-center text-white"
        style={{
          backgroundImage: config?.banner_url ? `url(${config.banner_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: config?.banner_url ? undefined : '#09090b',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-widest mb-3 sm:mb-4">
            {config?.nome_loja ?? 'VERSAR'}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-zinc-300 mb-2">
            {config?.banner_titulo ?? 'Moda masculina de qualidade'}
          </p>
          <p className="text-sm sm:text-base text-zinc-400 mb-6 sm:mb-8">
            {config?.banner_subtitulo ?? 'Estilo que faz a diferença'}
          </p>
          <a
            href="#produtos"
            className="inline-block bg-white text-black px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-zinc-200 transition-colors text-sm sm:text-base"
          >
            Ver coleção
          </a>
        </div>
      </section>

      {/* Destaques */}
      {destaques.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6 sm:mb-8">Destaques</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {destaques.map(produto => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      )}

      {/* Todos os produtos */}
      <section id="produtos" className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6 sm:mb-8">Coleção completa</h2>

        {/* Filtro por categoria */}
        {categorias && categorias.length > 0 && (
          <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <a
              href="#produtos"
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm bg-zinc-950 text-white"
            >
              Todos
            </a>
            {categorias.map(cat => (
              <a
                key={cat.id}
                href={`#cat-${cat.slug}`}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm border border-zinc-200 text-zinc-600 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
              >
                {cat.nome}
              </a>
            ))}
          </div>
        )}

        {(!produtos || produtos.length === 0) && (
          <p className="text-zinc-400 text-center py-16">Nenhum produto disponível no momento.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {produtos?.map(produto => (
            <ProdutoCard key={produto.id} produto={produto} />
          ))}
        </div>
      </section>
    </div>
  )
}
