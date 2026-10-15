import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  searchParams: Promise<{ id?: string }>
}

export default async function OrderConfirmedPage({ searchParams }: Props) {
  const { id } = await searchParams

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Order confirmed!</h1>
        {id && (
          <p className="text-zinc-500 mt-2 text-sm">Order <span className="font-semibold text-zinc-700">#{id.slice(0, 8).toUpperCase()}</span> placed successfully</p>
        )}
      </div>

      <div className="max-w-sm bg-zinc-50 rounded-2xl p-5 border border-zinc-100 text-sm text-zinc-600 leading-relaxed">
        <p>The store's WhatsApp was opened with your order summary.</p>
        <p className="mt-2">Send the message to confirm and arrange payment and shipping. 📦</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/produtos"
          className="px-6 py-3 border border-zinc-200 text-zinc-700 font-semibold rounded-full hover:bg-zinc-50 transition-colors">
          Continue shopping
        </Link>
        <Link href="/"
          className="px-6 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 transition-colors">
          Back to home
        </Link>
      </div>
    </div>
  )
}