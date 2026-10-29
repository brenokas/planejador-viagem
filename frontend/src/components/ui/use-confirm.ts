import { createContext, useContext } from 'react'

export type ConfirmOptions = {
  titulo: string
  mensagem?: string
  /** Texto do botão de confirmação. */
  confirmar?: string
  /** Ação destrutiva: botão vermelho. */
  perigo?: boolean
}

export type Confirm = (opcoes: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<Confirm>(async (o) => window.confirm(o.mensagem ?? o.titulo))

/** Pede confirmação numa folha no estilo do app. Resolve `true` se a pessoa confirmar. */
export function useConfirm() {
  return useContext(ConfirmContext)
}
