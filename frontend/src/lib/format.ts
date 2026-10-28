/** Datas no formato ISO "AAAA-MM-DD" (LocalDate do backend), sem conversão de fuso. */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const MS_DIA = 86_400_000

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_DIA)
}

export function tripDays(inicio: string, fim: string): number {
  return daysBetween(parseDate(inicio), parseDate(fim)) + 1
}

export function formatDateRange(inicio: string, fim: string): string {
  const a = parseDate(inicio)
  const b = parseDate(fim)
  const dia = new Intl.DateTimeFormat('pt-BR', { day: 'numeric' })
  const diaMes = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
  const completo = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

  if (a.getTime() === b.getTime()) return completo.format(a)
  if (a.getFullYear() !== b.getFullYear()) return `${completo.format(a)} – ${completo.format(b)}`
  if (a.getMonth() === b.getMonth()) return `${dia.format(a)} – ${completo.format(b)}`
  return `${diaMes.format(a)} – ${completo.format(b)}`
}

export type TripStatus =
  | { tipo: 'futura'; faltam: number }
  | { tipo: 'andamento'; dia: number; total: number }
  | { tipo: 'concluida' }

export function tripStatus(inicio: string, fim: string): TripStatus {
  const hoje = today()
  const a = parseDate(inicio)
  const b = parseDate(fim)
  if (hoje < a) return { tipo: 'futura', faltam: daysBetween(hoje, a) }
  if (hoje > b) return { tipo: 'concluida' }
  return { tipo: 'andamento', dia: daysBetween(a, hoje) + 1, total: daysBetween(a, b) + 1 }
}

export function formatStatus(status: TripStatus): string {
  switch (status.tipo) {
    case 'futura':
      return status.faltam === 1 ? 'Amanhã!' : `Faltam ${status.faltam} dias`
    case 'andamento':
      return `Dia ${status.dia} de ${status.total}`
    case 'concluida':
      return 'Concluída'
  }
}

export const MOEDAS = [
  { codigo: 'BRL', nome: 'Real (R$)' },
  { codigo: 'USD', nome: 'Dólar americano (US$)' },
  { codigo: 'EUR', nome: 'Euro (€)' },
  { codigo: 'GBP', nome: 'Libra (£)' },
  { codigo: 'ARS', nome: 'Peso argentino' },
  { codigo: 'CLP', nome: 'Peso chileno' },
  { codigo: 'UYU', nome: 'Peso uruguaio' },
  { codigo: 'MXN', nome: 'Peso mexicano' },
  { codigo: 'CAD', nome: 'Dólar canadense' },
  { codigo: 'JPY', nome: 'Iene' },
  { codigo: 'CHF', nome: 'Franco suíço' },
] as const

export function formatMoney(centavos: number, moeda: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(centavos / 100)
}

/** Converte "1.234,56" (ou "1234.56") para número. Retorna null se vazio e NaN se inválido. */
export function parseDecimal(texto: string): number | null {
  const limpo = texto.trim().replace(/[^\d,.-]/g, '')
  if (!limpo) return null
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const valor = Number(normalizado)
  return Number.isFinite(valor) ? valor : Number.NaN
}

/** Converte "1.234,56" (ou "1234.56") para centavos. Retorna null se vazio e NaN se inválido. */
export function parseMoney(texto: string): number | null {
  const valor = parseDecimal(texto)
  return valor == null || Number.isNaN(valor) ? valor : Math.round(valor * 100)
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function centsToInput(centavos: number | null): string {
  if (centavos == null) return ''
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
