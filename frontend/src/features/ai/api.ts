import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activityKeys, type Activity, type Category } from '@/features/itinerary/api'
import { api, json } from '@/lib/api'

export type ActivitySuggestion = {
  data: string | null
  titulo: string
  horaInicio: string | null
  horaFim: string | null
  categoria: Category
  localNome: string | null
  lat: number | null
  lng: number | null
  custoCentavos: number | null
  notas: string | null
}

export type SuggestionsResponse = { atividades: ActivitySuggestion[]; aviso: string | null }
export type PackingResponse = { bagagem: string[]; tarefas: string[] }
export type Ritmo = 'TRANQUILO' | 'EQUILIBRADO' | 'INTENSO'

export type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  autorId: number | null
  autorNome: string | null
  conteudo: string
  criadoEm: string
}

const chatKey = (tripId: number) => ['trips', 'detail', tripId, 'ai-chat'] as const

export function useGenerateItinerary(tripId: number) {
  return useMutation({
    mutationFn: (body: { ritmo: Ritmo; interesses: string[]; observacoes: string }) =>
      api<SuggestionsResponse>(`/trips/${tripId}/ai/itinerary`, { method: 'POST', body: json(body) }),
  })
}

export function useDaySuggestions(tripId: number) {
  return useMutation({
    mutationFn: (body: { data: string | null; pedido: string }) =>
      api<SuggestionsResponse>(`/trips/${tripId}/ai/day-suggestions`, { method: 'POST', body: json(body) }),
  })
}

export function usePackingSuggestions(tripId: number) {
  return useMutation({
    mutationFn: () => api<PackingResponse>(`/trips/${tripId}/ai/packing-list`, { method: 'POST' }),
  })
}

/** Salva as sugestões escolhidas como atividades do roteiro. */
export function useAcceptSuggestions(tripId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itens: ActivitySuggestion[]) =>
      api<Activity[]>(`/trips/${tripId}/activities/bulk`, { method: 'POST', body: json({ itens }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: activityKeys.list(tripId) }),
  })
}

export function useChatHistory(tripId: number) {
  return useQuery({ queryKey: chatKey(tripId), queryFn: () => api<ChatMessage[]>(`/trips/${tripId}/ai/chat`) })
}

export function useSendMessage(tripId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mensagem: string) =>
      api<ChatMessage[]>(`/trips/${tripId}/ai/chat`, { method: 'POST', body: json({ mensagem }) }),
    onSuccess: (novas) => qc.setQueryData<ChatMessage[]>(chatKey(tripId), (old = []) => [...old, ...novas]),
  })
}

export function useClearChat(tripId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>(`/trips/${tripId}/ai/chat`, { method: 'DELETE' }),
    onSuccess: () => qc.setQueryData(chatKey(tripId), []),
  })
}
