import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  label,
  className,
  barClassName,
}: {
  /** 0 a 100 */
  value: number
  label: string
  className?: string
  barClassName?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className={cn('h-1.5 overflow-hidden rounded-full bg-slate-100', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full bg-primary transition-[width]', barClassName)} style={{ width: `${pct}%` }} />
    </div>
  )
}
