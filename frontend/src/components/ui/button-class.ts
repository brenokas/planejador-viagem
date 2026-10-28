import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  outline: 'border border-slate-300 bg-white hover:bg-slate-100',
  ghost: 'hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

/** Classes do botão, para aplicar também em links. */
export function buttonClass(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    className,
  )
}
