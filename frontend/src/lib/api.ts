import { CLIENT_ID } from './clientId'

export class ApiError extends Error {
  readonly status: number
  readonly campos: Record<string, string>

  constructor(status: number, mensagem: string, campos: Record<string, string> = {}) {
    super(mensagem)
    this.status = status
    this.campos = campos
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('X-Client-Id', CLIENT_ID)
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let res: Response
  try {
    res = await fetch(`/api${path}`, { ...init, headers, credentials: 'same-origin' })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new ApiError(
      res.status,
      data?.mensagem ?? (res.status === 401 ? 'Sessão expirada.' : 'Erro inesperado.'),
      data?.campos ?? {},
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const json = (body: unknown) => JSON.stringify(body)
