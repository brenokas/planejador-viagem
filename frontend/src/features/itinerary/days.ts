import { parseDate } from '@/lib/format'
import type { Activity } from './api'

export type DayGroup = {
  /** Data ISO; null = Ideias */
  data: string | null
  /** 1-based; 0 para Ideias e dias fora da viagem */
  numero: number
  atividades: Activity[]
}

function toIso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

export function tripDates(inicio: string, fim: string): string[] {
  const datas: string[] = []
  const atual = parseDate(inicio)
  const ultimo = parseDate(fim)
  while (atual <= ultimo) {
    datas.push(toIso(atual))
    atual.setDate(atual.getDate() + 1)
  }
  return datas
}

const byOrdem = (a: Activity, b: Activity) => a.ordem - b.ordem || a.id - b.id

export function groupByDay(atividades: Activity[], datas: string[]) {
  const porData = new Map<string | null, Activity[]>()
  for (const a of atividades) {
    const lista = porData.get(a.data) ?? []
    lista.push(a)
    porData.set(a.data, lista)
  }
  const dias: DayGroup[] = datas.map((data, i) => ({
    data,
    numero: i + 1,
    atividades: (porData.get(data) ?? []).sort(byOrdem),
  }))
  const ideias: DayGroup = { data: null, numero: 0, atividades: (porData.get(null) ?? []).sort(byOrdem) }
  const foraDasDatas = atividades.filter((a) => a.data && !datas.includes(a.data)).sort(
    (a, b) => a.data!.localeCompare(b.data!) || byOrdem(a, b),
  )
  return { dias, ideias, foraDasDatas }
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).format(parseDate(iso))
}

export function formatShortDay(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(parseDate(iso))
}

export function formatTime(hora: string | null) {
  return hora ? hora.slice(0, 5) : null
}

export function googleMapsUrl(a: { lat: number | null; lng: number | null; localNome: string | null }) {
  if (a.lat != null && a.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`
  }
  if (a.localNome) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.localNome)}`
  return null
}

/** Numeração usada no mapa: só atividades com coordenadas, na ordem do dia. */
export function mapNumbers(atividades: Activity[]) {
  const numeros = new Map<number, number>()
  let n = 0
  for (const a of atividades) if (a.lat != null) numeros.set(a.id, ++n)
  return numeros
}
