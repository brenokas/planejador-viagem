import type { ReactNode } from 'react'
import { Postmark } from '@/components/ui/postmark'

/** Telas de entrada como um cartão-postal com borda de correio aéreo. */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-3 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8 sm:items-center sm:justify-center sm:px-4">
      <div className="airmail w-full rounded-2xl p-1.5 shadow-lift sm:max-w-md">
        <div className="relative overflow-hidden rounded-xl bg-white px-5 pt-6 pb-8 sm:px-8">
          <Postmark
            topo="Correio de viagem"
            linhas={['casal', 'a dois', 'desde já']}
            className="absolute -top-3 -right-16 w-40 rotate-[-14deg] text-tomato/45"
          />
          <p className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold italic" style={{ fontVariationSettings: "'SOFT' 100" }}>
              Planejador
            </span>
            <span className="label-mono text-[10px] text-tomato-ink">de viagem</span>
          </p>
          <p className="mt-2 max-w-[13rem] text-sm text-pretty text-slate-600">
            O roteiro, as contas e a mala de vocês dois num lugar só.
          </p>
          <h1 className="mt-10 mb-6 border-b border-dashed border-slate-300 pb-3 text-4xl font-semibold">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}
