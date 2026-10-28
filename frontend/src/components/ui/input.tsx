import type { InputHTMLAttributes, ReactNode, Ref, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
        'aria-invalid:border-red-500 aria-invalid:ring-red-500/20',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return (
    <textarea
      className={cn(
        'min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
        className,
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
