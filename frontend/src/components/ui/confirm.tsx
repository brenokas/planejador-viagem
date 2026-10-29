import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Button } from './button'
import { Dialog } from './dialog'
import { ConfirmContext, type Confirm, type ConfirmOptions } from './use-confirm'

/** Substitui o window.confirm por uma folha no estilo do app. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opcoes, setOpcoes] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(ok: boolean) => void>(null)

  const confirm = useCallback<Confirm>((o) => {
    resolver.current?.(false)
    setOpcoes(o)
    return new Promise((resolve) => (resolver.current = resolve))
  }, [])

  const responder = useCallback((ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setOpcoes(null)
  }, [])
  const cancelar = useCallback(() => responder(false), [responder])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={opcoes != null} onClose={cancelar} title={opcoes?.titulo ?? ''}>
        {opcoes?.mensagem && <p className="text-sm text-pretty text-slate-600">{opcoes.mensagem}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={cancelar}>
            Cancelar
          </Button>
          <Button variant={opcoes?.perigo ? 'danger' : 'primary'} onClick={() => responder(true)}>
            {opcoes?.confirmar ?? 'Confirmar'}
          </Button>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  )
}
