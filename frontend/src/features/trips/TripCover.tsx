import { cn } from '@/lib/utils'

const gradientes = [
  'from-teal-500 to-sky-600',
  'from-rose-400 to-orange-400',
  'from-indigo-500 to-fuchsia-500',
  'from-amber-400 to-rose-500',
  'from-emerald-500 to-teal-700',
  'from-sky-500 to-indigo-600',
]

/** Imagem de capa da viagem ou um gradiente fixo baseado no id. */
export function TripCover({ id, capaUrl, className }: { id: number; capaUrl: string | null; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', gradientes[id % gradientes.length], className)}>
      {capaUrl && (
        <img
          src={capaUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
    </div>
  )
}
