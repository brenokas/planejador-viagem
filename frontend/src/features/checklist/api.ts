import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json } from '@/lib/api'

export type ChecklistType = 'BAGAGEM' | 'TAREFA'

export type ChecklistItem = {
  id: number
  tipo: ChecklistType
  texto: string
  feito: boolean
  responsavelId: number | null
  prazo: string | null
  feitoPorNome: string | null
  version: number
}

export type ItemInput = {
  tipo: ChecklistType
  texto: string
  responsavelId: number | null
  prazo: string | null
  version?: number
}

export const checklistKey = (tripId: number) => ['trips', 'detail', tripId, 'checklist'] as const

export function useChecklist(tripId: number) {
  return useQuery({ queryKey: checklistKey(tripId), queryFn: () => api<ChecklistItem[]>(`/trips/${tripId}/checklist`) })
}

function useChecklistCache(tripId: number) {
  const qc = useQueryClient()
  const key = checklistKey(tripId)
  return {
    qc,
    key,
    upsert: (item: ChecklistItem) =>
      qc.setQueryData<ChecklistItem[]>(key, (old = []) =>
        old.some((i) => i.id === item.id) ? old.map((i) => (i.id === item.id ? item : i)) : [...old, item],
      ),
  }
}

export function useCreateItem(tripId: number) {
  const { upsert } = useChecklistCache(tripId)
  return useMutation({
    mutationFn: (input: ItemInput) => api<ChecklistItem>(`/trips/${tripId}/checklist`, { method: 'POST', body: json(input) }),
    onSuccess: upsert,
  })
}

export function useAddMany(tripId: number) {
  const { qc, key } = useChecklistCache(tripId)
  return useMutation({
    mutationFn: (body: { tipo: ChecklistType; textos: string[] }) =>
      api<ChecklistItem[]>(`/trips/${tripId}/checklist/bulk`, { method: 'POST', body: json(body) }),
    onSuccess: (novos) => qc.setQueryData<ChecklistItem[]>(key, (old = []) => [...old, ...novos]),
  })
}

export function useUpdateItem(tripId: number) {
  const { upsert } = useChecklistCache(tripId)
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ItemInput }) =>
      api<ChecklistItem>(`/trips/${tripId}/checklist/${id}`, { method: 'PUT', body: json(input) }),
    onSuccess: upsert,
  })
}

export function useToggleItem(tripId: number) {
  const { qc, key, upsert } = useChecklistCache(tripId)
  return useMutation({
    mutationFn: ({ id, feito }: { id: number; feito: boolean }) =>
      api<ChecklistItem>(`/trips/${tripId}/checklist/${id}/done`, { method: 'PATCH', body: json({ feito }) }),
    onMutate: async ({ id, feito }) => {
      await qc.cancelQueries({ queryKey: key })
      const anterior = qc.getQueryData<ChecklistItem[]>(key)
      qc.setQueryData<ChecklistItem[]>(key, (old = []) => old.map((i) => (i.id === id ? { ...i, feito } : i)))
      return { anterior }
    },
    onError: (_e, _v, ctx) => ctx?.anterior && qc.setQueryData(key, ctx.anterior),
    onSuccess: upsert,
  })
}

export function useDeleteItem(tripId: number) {
  const { qc, key } = useChecklistCache(tripId)
  return useMutation({
    mutationFn: (id: number) => api<void>(`/trips/${tripId}/checklist/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => qc.setQueryData<ChecklistItem[]>(key, (old = []) => old.filter((i) => i.id !== id)),
  })
}
