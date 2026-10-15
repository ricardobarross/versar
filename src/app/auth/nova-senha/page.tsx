'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SenhaForm from '@/components/admin/SenhaForm'

export default function NovaSenhaPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-widest">VERSAR</h1>
          <p className="text-zinc-400 mt-2 text-sm">Criar nova senha</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 space-y-4">
          <SenhaForm onSucesso={() => setTimeout(() => { router.push('/admin'); router.refresh() }, 1200)} />
          <Link href="/auth/login" className="block text-center text-sm text-zinc-400 hover:text-white">
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
