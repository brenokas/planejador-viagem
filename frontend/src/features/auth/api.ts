import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, json } from '@/lib/api'

export type User = {
  id: number
  nome: string
  email: string
  avatarUrl: string | null
}

export type LoginInput = { email: string; senha: string }
export type RegisterInput = LoginInput & { nome: string }

const meKey = ['me']

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async () => {
      try {
        return await api<User>('/me')
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: Infinity,
    retry: false,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => api<User>('/auth/login', { method: 'POST', body: json(input) }),
    onSuccess: (user) => qc.setQueryData(meKey, user),
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterInput) => api<User>('/auth/register', { method: 'POST', body: json(input) }),
    onSuccess: (user) => qc.setQueryData(meKey, user),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      qc.clear()
      qc.setQueryData(meKey, null)
    },
  })
}
