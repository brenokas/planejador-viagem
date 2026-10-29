import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router'
import { checklistKey } from '@/features/checklist/api'
import { activityKeys } from '@/features/itinerary/api'
import { CLIENT_ID } from '@/lib/clientId'
import { PresenceContext } from './presence'

type TripEvent = {
  tipo: 'trip' | 'activities' | 'expenses' | 'checklist' | 'chat' | 'presenca'
  origem: string | null
  online: number[] | null
}

/**
 * Envolve as telas de uma viagem e mantém uma conexão SSE aberta enquanto alguma delas estiver na tela.
 * Quando a outra pessoa muda algo, recarrega só a parte afetada.
 */
export function TripRealtime() {
  const tripId = Number(useParams().id)
  const qc = useQueryClient()
  const [online, setOnline] = useState<number[]>([])

  useEffect(() => {
    if (!Number.isFinite(tripId)) return
    const detalhe = ['trips', 'detail', tripId] as const
    let jaConectou = false

    const source = new EventSource(`/api/trips/${tripId}/events`)

    source.onopen = () => {
      // Depois de uma queda (Wi-Fi, celular bloqueado), recarrega tudo para não perder nada.
      if (jaConectou) qc.invalidateQueries({ queryKey: detalhe })
      jaConectou = true
    }

    source.onmessage = (e) => {
      let evento: TripEvent
      try {
        evento = JSON.parse(e.data)
      } catch {
        return
      }
      if (evento.tipo === 'presenca') {
        setOnline(evento.online ?? [])
        return
      }
      if (evento.origem === CLIENT_ID) return

      switch (evento.tipo) {
        case 'trip':
          qc.invalidateQueries({ queryKey: detalhe })
          qc.invalidateQueries({ queryKey: ['trips', 'list'] })
          break
        case 'activities':
          qc.invalidateQueries({ queryKey: activityKeys.list(tripId) })
          qc.invalidateQueries({ queryKey: [...detalhe, 'expenses', 'summary'] })
          break
        case 'expenses':
          qc.invalidateQueries({ queryKey: [...detalhe, 'expenses'] })
          break
        case 'checklist':
          qc.invalidateQueries({ queryKey: checklistKey(tripId) })
          break
        case 'chat':
          qc.invalidateQueries({ queryKey: [...detalhe, 'ai-chat'] })
          break
      }
    }

    return () => source.close()
  }, [tripId, qc])

  return (
    <PresenceContext.Provider value={online}>
      <Outlet />
    </PresenceContext.Provider>
  )
}
