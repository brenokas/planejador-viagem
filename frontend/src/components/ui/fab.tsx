import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Botão flutuante da ação principal no celular, logo acima da barra inferior (alcance do polegar). */
export function Fab({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string }) {
  return (
    <button
      className={cn(
        'fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-2xl',
        'bg-primary text-primary-foreground shadow-lg shadow-slate-900/20 transition-transform hover:bg-primary-hover active:scale-95',
        'sm:hidden',
        className,
      )}
      {...props}
    />
  )
}
