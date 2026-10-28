import type { Ref, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
        className,
      )}
      {...props}
    />
  )
}
