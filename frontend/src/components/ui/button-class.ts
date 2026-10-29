import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-[2px_2px_0_0_rgb(30_26_21/0.18)] hover:bg-primary-hover active:translate-y-px active:shadow-none',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50',
  ghost: 'hover:bg-slate-100',
  danger: 'bg-[#9f1d1d] text-white hover:bg-[#831717]',
}

/** Classes do botão, para aplicar também em links. */
export function buttonClass(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    className,
  )
}
