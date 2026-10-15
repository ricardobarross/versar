import { NextResponse } from 'next/server'
import { requireAdmin, apiError, check, assertUuid } from '@/lib/api'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    assertUuid(params.id)
    const { supabase } = await requireAdmin(req)
    check(await supabase.from('destaques').delete().eq('id', params.id), 'Erro ao apagar destaque.')
    return NextResponse.json({ success: true, message: 'Destaque removido com sucesso.' })
  } catch (err) {
    return apiError(err)
  }
}
