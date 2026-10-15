/**
 * Datas no fuso da loja (Brasília).
 * O servidor da Vercel corre em UTC; sem isto as horas apareciam 3h adiantadas
 * e os totais "do mês" viravam de mês às 21h do último dia.
 */
export const FUSO_LOJA = 'America/Sao_Paulo'

/** Brasília está em UTC−3 o ano inteiro (sem horário de verão desde 2019). */
const OFFSET_HORAS = 3

type DataEntrada = string | number | Date | null | undefined

function paraData(v: DataEntrada) {
  if (v == null) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** 15/10/2026 */
export function formatarData(v: DataEntrada) {
  const d = paraData(v)
  return d ? d.toLocaleDateString('pt-BR', { timeZone: FUSO_LOJA }) : ''
}

/** 15/10/2026, 18:09 */
export function formatarDataHora(v: DataEntrada) {
  const d = paraData(v)
  return d ? d.toLocaleString('pt-BR', { timeZone: FUSO_LOJA, dateStyle: 'short', timeStyle: 'short' }) : ''
}

/** Ano, mês (1–12) e dia de hoje no fuso da loja. */
function hojeNaLojaPartes(agora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_LOJA, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(agora)
  const valor = (t: string) => Number(partes.find(p => p.type === t)?.value)
  return { ano: valor('year'), mes: valor('month'), dia: valor('day') }
}

/** "2026-10-15" — o dia de hoje na loja (para comparar com colunas `date`). */
export function hojeNaLoja(agora = new Date()) {
  const { ano, mes, dia } = hojeNaLojaPartes(agora)
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/**
 * Início de um mês (00:00 em Brasília) como ISO/UTC.
 * deslocamento 0 = mês atual, −1 = mês passado, 1 = próximo mês.
 */
export function inicioDoMes(deslocamento = 0, agora = new Date()) {
  const { ano, mes } = hojeNaLojaPartes(agora)
  return new Date(Date.UTC(ano, mes - 1 + deslocamento, 1, OFFSET_HORAS)).toISOString()
}
