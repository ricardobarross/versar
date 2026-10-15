'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function EsqueciSenhaPage() {
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/nova-senha`,
    })
    setEnviando(false)
    // Por segurança, a mensagem é a mesma exista ou não a conta.
    if (error && error.status === 429) {
      setErro('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
      return
    }
    setEnviado(true)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-widest">VERSAR</h1>
          <p className="text-zinc-400 mt-2 text-sm">Recuperar senha</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 space-y-4">
          {enviado ? (
            <p className="text-zinc-300 text-sm leading-relaxed">
              Se existir uma conta com <span className="text-white font-medium">{email}</span>, você vai receber
              um e-mail com um link para criar uma nova senha. Confira também a caixa de spam.
            </p>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <p className="text-zinc-400 text-sm">Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>
              <div>
                <label className="block text-zinc-300 text-sm mb-2">E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                  className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none" />
              </div>
              {erro && <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{erro}</p>}
              <button type="submit" disabled={enviando}
                className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
                {enviando ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          )}
          <Link href="/auth/login" className="block text-center text-sm text-zinc-400 hover:text-white">
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
