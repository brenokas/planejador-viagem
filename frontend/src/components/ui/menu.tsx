import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Menu({
  trigger,
  label = 'Mais opções',
  triggerClassName,
  children,
}: {
  trigger: ReactNode
  label?: string
  triggerClassName?: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={cn('rounded-full bg-white p-2 text-slate-700 shadow-card ring-1 ring-slate-200 hover:bg-slate-50', triggerClassName)}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl bg-white py-1 shadow-lift ring-1 ring-slate-300"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50',
        danger ? 'text-red-600' : 'text-slate-700',
      )}
    >
      {children}
    </button>
  )
}
