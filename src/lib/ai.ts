/**
 * Chamada mínima à API da Anthropic (Secretária Inteligente).
 * - Sem ANTHROPIC_API_KEY devolve null e as rotas usam o texto de reserva.
 * - O modelo pode ser trocado com ANTHROPIC_MODEL, sem mexer no código.
 */
const DEFAULT_MODEL = 'claude-haiku-5-5'

export async function askClaude(system: string, content: string, maxTokens = 400): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content }],
      }),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('[IA] Anthropic respondeu', res.status, await res.text().catch(() => ''))
      return null
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] }
    const text = data.content?.find(c => c.type === 'text')?.text?.trim()
    return text || null
  } catch (err) {
    console.error('[IA] Falha ao chamar a Anthropic', err)
    return null
  }
}
