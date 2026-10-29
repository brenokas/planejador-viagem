import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Botão flutuante da ação principal no celular, logo acima da barra inferior (alcance do polegar). */
export function Fab({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string }) {
  return (
    <button
      className={cn(
        'fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full',
        'bg-tomato text-white shadow-lift ring-2 ring-white transition-transform hover:bg-tomato-ink active:scale-95',
        'sm:hidden',
        className,
      )}
      {...props}
    />
  )
}
