import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json } from '@/lib/api'

export type TripRole = 'DONO' | 'EDITOR'

export type Member = {
  id: number
  nome: string
  avatarUrl: string | null
  papel: TripRole
}

export type Trip = {
  id: number
  titulo: string
  destino: string
  dataInicio: string
  dataFim: string
  moeda: string
  orcamentoCentavos: number | null
  capaUrl: string | null
  arquivada: boolean
  meuPapel: TripRole
  membros: Member[]
  atualizadoEm: string
  version: number
}

export type TripInput = {
  titulo: string
  destino: string
  dataInicio: string
  dataFim: string
  moeda: string
  orcamentoCentavos: number | null
  capaUrl: string | null
  version?: number
}

export type Invite = { token: string; expiraEm: string }

export type InvitePreview = {
  tripId: number
  titulo: string
  destino: string
  dataInicio: string
  dataFim: string
  convidadoPor: string
  jaMembro: boolean
}

export const tripKeys = {
  all: ['trips'] as const,
  list: (arquivadas: boolean) => ['trips', 'list', { arquivadas }] as const,
  detail: (id: number) => ['trips', 'detail', id] as const,
}

export function useTrips(arquivadas = false) {
  return useQuery({
    queryKey: tripKeys.list(arquivadas),
    queryFn: () => api<Trip[]>(`/trips?arquivadas=${arquivadas}`),
  })
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => api<Trip>(`/trips/${id}`),
  })
}

function useTripMutation<V>(fn: (vars: V) => Promise<Trip>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (trip) => {
      qc.setQueryData(tripKeys.detail(trip.id), trip)
      qc.invalidateQueries({ queryKey: ['trips', 'list'] })
    },
  })
}

export function useCreateTrip() {
  return useTripMutation((input: TripInput) => api<Trip>('/trips', { method: 'POST', body: json(input) }))
}

export function useUpdateTrip(id: number) {
  return useTripMutation((input: TripInput) => api<Trip>(`/trips/${id}`, { method: 'PUT', body: json(input) }))
}

export function useArchiveTrip(id: number) {
  return useTripMutation((arquivada: boolean) =>
    api<Trip>(`/trips/${id}/archive`, { method: 'PATCH', body: json({ arquivada }) }),
  )
}

export function useDeleteTrip(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>(`/trips/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: tripKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['trips', 'list'] })
    },
  })
}

export function useRemoveMember(tripId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => api<void>(`/trips/${tripId}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  })
}

export function useCreateInvite(tripId: number) {
  return useMutation({
    mutationFn: () => api<Invite>(`/trips/${tripId}/invites`, { method: 'POST' }),
  })
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ['invites', token],
    queryFn: () => api<InvitePreview>(`/invites/${token}`),
    retry: false,
  })
}

export function useAcceptInvite(token: string) {
  return useTripMutation(() => api<Trip>(`/invites/${token}/accept`, { method: 'POST' }))
}
