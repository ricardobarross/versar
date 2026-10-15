import { NextResponse } from 'next/server'
import { requireAdmin, apiError, HttpError } from '@/lib/api'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
])

// POST /api/upload  (FormData: file) → URL pública no bucket "uploads"
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin(req)
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw new HttpError(400, 'Nenhum arquivo enviado.')

    const ext = ALLOWED.get(file.type)
    if (!ext) throw new HttpError(415, 'Formato não suportado. Envie JPG, PNG, WEBP, GIF ou AVIF.')
    if (file.size > MAX_BYTES) throw new HttpError(413, 'Arquivo muito grande (máximo 5 MB).')

    const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('uploads').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw new HttpError(500, 'Erro ao enviar arquivo.')

    const { data } = supabase.storage.from('uploads').getPublicUrl(path)
    return NextResponse.json({ success: true, message: 'Upload realizado com sucesso.', url: data.publicUrl, path }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
