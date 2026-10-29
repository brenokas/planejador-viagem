import { CalendarDays, ListChecks, MessageCircle, Plane, Wallet, type LucideIcon } from 'lucide-react'

export type TripTab = { path: string; label: string; icon: LucideIcon }

/** Partes da viagem, na ordem da barra de abas. `path` é relativo a /viagens/:id. */
export const TRIP_TABS: TripTab[] = [
  { path: '', label: 'Resumo', icon: Plane },
  { path: 'roteiro', label: 'Roteiro', icon: CalendarDays },
  { path: 'orcamento', label: 'Orçamento', icon: Wallet },
  { path: 'checklist', label: 'Checklist', icon: ListChecks },
  { path: 'assistente', label: 'Assistente', icon: MessageCircle },
]

export function tripTabUrl(tripId: number, tab: TripTab) {
  return tab.path ? `/viagens/${tripId}/${tab.path}` : `/viagens/${tripId}`
}
