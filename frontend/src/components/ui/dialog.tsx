import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Modal que vira "folha" inferior no celular e caixa centralizada no desktop. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const anterior = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      // Com um dialog sobre outro (ex.: confirmação), o Esc fecha só o de cima.
      const abertos = document.querySelectorAll('[role="dialog"]')
      if (e.key === 'Escape' && abertos[abertos.length - 1] === ref.current) onClose()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Foca a caixa (não o primeiro campo) para não abrir o teclado do celular sem pedir.
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      anterior?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-[fade-in_150ms_ease-out] bg-slate-900/40" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92dvh] w-full max-w-md animate-[sheet-in_200ms_ease-out] flex-col rounded-t-2xl bg-white shadow-xl outline-none sm:max-h-[85dvh] sm:animate-[fade-in_150ms_ease-out] sm:rounded-2xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" aria-hidden />
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 pb-3 sm:pt-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="-mr-1.5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
