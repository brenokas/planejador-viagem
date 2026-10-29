import type { ReactNode } from 'react'

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10 sm:items-center sm:justify-center">
      <div className="w-full sm:max-w-sm">
        <p className="font-display text-lg font-bold tracking-tight">
          Planejador<span className="text-primary">.</span>
        </p>
        <p className="mt-1 text-sm text-pretty text-slate-500">O roteiro, as contas e a mala de vocês dois num lugar só.</p>
        <h1 className="mt-10 mb-6 text-3xl font-semibold">{title}</h1>
        {children}
      </div>
    </div>
  )
}
