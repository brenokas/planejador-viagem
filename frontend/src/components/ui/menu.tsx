import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Menu({ trigger, children }: { trigger: ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-lg bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200"
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
