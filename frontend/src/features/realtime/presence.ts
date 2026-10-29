import { createContext, useContext } from 'react'

/** Ids de quem está com a viagem aberta agora (inclui o próprio usuário). */
export const PresenceContext = createContext<number[]>([])

export function useOnline() {
  return useContext(PresenceContext)
}
