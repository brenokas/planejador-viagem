import type { ReactNode } from 'react'

/** Cabeçalho das telas da viagem: título, uma linha de contexto e ações à direita. */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-0.5 truncate text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
