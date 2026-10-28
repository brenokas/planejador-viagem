import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/lib/api'

/** Copia os erros de validação do backend para os campos do formulário. */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>) {
  if (error instanceof ApiError) {
    for (const [campo, mensagem] of Object.entries(error.campos)) {
      setError(campo as Path<T>, { message: mensagem })
    }
  }
}
