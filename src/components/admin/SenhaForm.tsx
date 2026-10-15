'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Formulário para definir uma nova senha.
 * Com `email`, pede também a senha atual (troca dentro do painel).
 * Sem `email`, serve para o link de recuperação (a sessão vem do e-mail).
 */
export default function SenhaForm({ email, onSucesso }: { email?: string; onSucesso?: () => void }) {
  const [supabase] = useState(() => createClient())
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso(false)
    if (nova.length < 8) return setErro('A nova senha precisa ter pelo menos 8 caracteres.')
    if (nova !== confirmar) return setErro('As senhas não coincidem.')

    setSalvando(true)
    if (email) {
      const { error: atualErro } = await supabase.auth.signInWithPassword({ email, password: atual })
      if (atualErro) {
        setSalvando(false)
        return setErro('A senha atual está incorreta.')
      }
    }

    const { error } = await supabase.auth.updateUser({ password: nova })
    setSalvando(false)
    if (error) {
      return setErro(
        error.message.includes('different from the old')
          ? 'A nova senha tem de ser diferente da atual.'
          : error.message.includes('session')
            ? 'O link expirou. Peça um novo em "Esqueci a senha".'
            : error.message
      )
    }
    setAtual('')
    setNova('')
    setConfirmar('')
    setSucesso(true)
    onSucesso?.()
  }

  const input = 'w-full bg-zinc-800 text-white rounded-lg px-4 py-3 border border-zinc-700 focus:border-white focus:outline-none'

  return (
    <form onSubmit={salvar} className="space-y-4">
      {email && (
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Senha atual</label>
          <input type="password" autoComplete="current-password" value={atual} onChange={e => setAtual(e.target.value)} required className={input} />
        </div>
      )}
      <div>
        <label className="block text-zinc-400 text-sm mb-2">Nova senha</label>
        <input type="password" autoComplete="new-password" minLength={8} value={nova} onChange={e => setNova(e.target.value)} required className={input} />
        <p className="text-zinc-500 text-xs mt-1">Mínimo de 8 caracteres.</p>
      </div>
      <div>
        <label className="block text-zinc-400 text-sm mb-2">Confirmar nova senha</label>
        <input type="password" autoComplete="new-password" value={confirmar} onChange={e => setConfirmar(e.target.value)} required className={input} />
      </div>
      {erro && <p className="text-red-400 text-sm bg-red-950 rounded-lg px-4 py-3">{erro}</p>}
      {sucesso && <p className="text-green-400 text-sm bg-green-950 rounded-lg px-4 py-3">Senha alterada com sucesso!</p>}
      <button type="submit" disabled={salvando}
        className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
        {salvando ? 'Salvando...' : 'Alterar senha'}
      </button>
    </form>
  )
}
