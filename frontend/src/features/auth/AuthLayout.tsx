import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-white">
          <MapPin className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {children}
      </div>
    </div>
  )
}
