import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Pedido confirmado' }

export default async function PedidoConfirmadoPage({ searchParams }: { searchParams: Promise<{ numero?: string }> }) {
  const numero = (await searchParams).numero?.replace(/\D/g, '')

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Pedido recebido!</h1>
        {numero && (
          <p className="text-zinc-500 mt-2 text-sm">
            Seu pedido <span className="font-semibold text-zinc-700">#{numero}</span> foi registrado com sucesso.
          </p>
        )}
      </div>

      <div className="max-w-sm bg-zinc-50 rounded-2xl p-5 border border-zinc-100 text-sm text-zinc-600 leading-relaxed">
        <p>Abrimos o WhatsApp da loja com o resumo do seu pedido.</p>
        <p className="mt-2">Envie a mensagem para confirmar e combinar o pagamento e a entrega. 📦</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/produtos"
          className="px-6 py-3 border border-zinc-200 text-zinc-700 font-semibold rounded-full hover:bg-zinc-50 transition-colors"
        >
          Continuar comprando
        </Link>
        <Link
          href="/"
          className="px-6 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
