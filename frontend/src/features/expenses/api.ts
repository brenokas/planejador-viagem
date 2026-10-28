import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json } from '@/lib/api'

export type ExpenseCategory = 'HOSPEDAGEM' | 'TRANSPORTE' | 'ALIMENTACAO' | 'PASSEIOS' | 'COMPRAS' | 'OUTROS' | 'ACERTO'
export type SplitMode = 'IGUAL' | 'VALORES'

export type PersonRef = { id: number; nome: string }

export type Expense = {
  id: number
  descricao: string
  categoria: ExpenseCategory
  valorCentavos: number
  moeda: string
  taxaCambio: number
  valorConvertidoCentavos: number
  data: string
  pagoPor: PersonRef
  modoDivisao: SplitMode
  divisao: { userId: number; nome: string; valorCentavos: number; valorConvertidoCentavos: number }[]
  atualizadoPorNome: string | null
  atualizadoEm: string
  version: number
}

export type ExpenseInput = {
  descricao: string
  categoria: ExpenseCategory
  valorCentavos: number
  moeda: string
  taxaCambio: number | null
  data: string
  pagoPor: number
  modoDivisao: SplitMode
  participantes?: number[]
  valores?: Record<number, number>
  version?: number
}

export type Summary = {
  moeda: string
  orcamentoCentavos: number | null
  totalGastoCentavos: number
  previstoRoteiroCentavos: number
  porCategoria: { categoria: ExpenseCategory; totalCentavos: number }[]
  pessoas: { id: number; nome: string; pagouCentavos: number; consumoCentavos: number; saldoCentavos: number }[]
  acertos: { de: PersonRef; para: PersonRef; valorCentavos: number }[]
}

export type Rate = { de: string; para: string; taxa: number; atualizadoEm: string }

const keys = {
  list: (tripId: number) => ['trips', 'detail', tripId, 'expenses'] as const,
  summary: (tripId: number) => ['trips', 'detail', tripId, 'expenses', 'summary'] as const,
}

export function useExpenses(tripId: number) {
  return useQuery({ queryKey: keys.list(tripId), queryFn: () => api<Expense[]>(`/trips/${tripId}/expenses`) })
}

export function useExpenseSummary(tripId: number) {
  return useQuery({
    queryKey: keys.summary(tripId),
    queryFn: () => api<Summary>(`/trips/${tripId}/expenses/summary`),
  })
}

/** Invalida lista e resumo (o prefixo da lista cobre os dois). */
function useInvalidateExpenses(tripId: number) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: keys.list(tripId) })
}

export function useSaveExpense(tripId: number) {
  const invalidate = useInvalidateExpenses(tripId)
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: ExpenseInput }) =>
      id
        ? api<Expense>(`/trips/${tripId}/expenses/${id}`, { method: 'PUT', body: json(input) })
        : api<Expense>(`/trips/${tripId}/expenses`, { method: 'POST', body: json(input) }),
    onSuccess: invalidate,
  })
}

export function useDeleteExpense(tripId: number) {
  const invalidate = useInvalidateExpenses(tripId)
  return useMutation({
    mutationFn: (id: number) => api<void>(`/trips/${tripId}/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useSettle(tripId: number) {
  const invalidate = useInvalidateExpenses(tripId)
  return useMutation({
    mutationFn: (body: { de: number; para: number; valorCentavos: number }) =>
      api<Expense>(`/trips/${tripId}/expenses/settle`, { method: 'POST', body: json(body) }),
    onSuccess: invalidate,
  })
}

export function useRate(de: string, para: string) {
  return useQuery({
    queryKey: ['exchange', de, para],
    enabled: de.length === 3 && para.length === 3 && de !== para,
    staleTime: 60 * 60 * 1000,
    retry: false,
    queryFn: () => api<Rate>(`/exchange?de=${de}&para=${para}`),
  })
}
