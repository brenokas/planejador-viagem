import { useLocation } from 'react-router'

type FromState = { from?: string } | null

/** Para onde voltar depois de entrar ou criar conta (ex.: link de convite). */
export function useRedirectTarget(): string {
  const from = (useLocation().state as FromState)?.from
  return from && from.startsWith('/') ? from : '/'
}
