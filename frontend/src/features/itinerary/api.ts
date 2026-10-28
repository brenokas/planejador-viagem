import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json } from '@/lib/api'

export type Category = 'PASSEIO' | 'REFEICAO' | 'TRANSPORTE' | 'HOSPEDAGEM' | 'COMPRAS' | 'OUTRO'

export type Activity = {
  id: number
  titulo: string
  data: string | null
  horaInicio: string | null
  horaFim: string | null
  categoria: Category
  localNome: string | null
  lat: number | null
  lng: number | null
  custoCentavos: number | null
  notas: string | null
  ordem: number
  atualizadoPorNome: string | null
  atualizadoEm: string
  version: number
}

export type ActivityInput = Omit<Activity, 'id' | 'ordem' | 'atualizadoPorNome' | 'atualizadoEm' | 'version'> & {
  version?: number
}

export type GeoPlace = { nome: string; endereco: string; lat: number; lng: number }

export const activityKeys = {
  list: (tripId: number) => ['trips', 'detail', tripId, 'activities'] as const,
}

export function useActivities(tripId: number) {
  return useQuery({
    queryKey: activityKeys.list(tripId),
    queryFn: () => api<Activity[]>(`/trips/${tripId}/activities`),
  })
}

export function useSaveActivity(tripId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: ActivityInput }) =>
      id
        ? api<Activity>(`/trips/${tripId}/activities/${id}`, { method: 'PUT', body: json(input) })
        : api<Activity>(`/trips/${tripId}/activities`, { method: 'POST', body: json(input) }),
    // A posição das outras atividades do dia pode mudar, então recarrega a lista.
    onSettled: () => qc.invalidateQueries({ queryKey: activityKeys.list(tripId) }),
  })
}

export function useDeleteActivity(tripId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/trips/${tripId}/activities/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) =>
      qc.setQueryData<Activity[]>(activityKeys.list(tripId), (old) => old?.filter((a) => a.id !== id)),
  })
}

export function useReorderActivities(tripId: number) {
  const qc = useQueryClient()
  const key = activityKeys.list(tripId)
  return useMutation({
    mutationFn: ({ data, ids }: { data: string | null; ids: number[] }) =>
      api<Activity[]>(`/trips/${tripId}/activities/order`, { method: 'PUT', body: json({ data, ids }) }),
    onMutate: async ({ ids }) => {
      await qc.cancelQueries({ queryKey: key })
      const anterior = qc.getQueryData<Activity[]>(key)
      qc.setQueryData<Activity[]>(key, (old) =>
        old?.map((a) => (ids.includes(a.id) ? { ...a, ordem: ids.indexOf(a.id) } : a)),
      )
      return { anterior }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.anterior) qc.setQueryData(key, ctx.anterior)
      qc.invalidateQueries({ queryKey: key })
    },
    onSuccess: (lista) => qc.setQueryData(key, lista),
  })
}

/** Busca primeiro perto do destino da viagem; se não achar nada, busca o texto sozinho. */
export function useGeoSearch(texto: string, destino: string) {
  const q = texto.trim()
  return useQuery({
    queryKey: ['geo', q, destino],
    enabled: q.length >= 3,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const buscar = (termo: string) => api<GeoPlace[]>(`/geo/search?q=${encodeURIComponent(termo)}`)
      if (!q.includes(',') && destino) {
        const perto = await buscar(`${q}, ${destino}`)
        if (perto.length > 0) return perto
      }
      return buscar(q)
    },
  })
}
