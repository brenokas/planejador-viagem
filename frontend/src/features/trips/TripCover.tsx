import { cn } from '@/lib/utils'

// Tons fechados e sólidos; o branco do texto passa em contraste AA em todos.
const fundos = ['bg-teal-700', 'bg-amber-700', 'bg-rose-800', 'bg-slate-700', 'bg-emerald-800', 'bg-sky-800']

/**
 * Capa da viagem: a imagem informada ou, sem imagem, uma cor fixa por viagem com o nome do destino em destaque.
 * O destino é o que identifica a viagem de relance na lista.
 */
export function TripCover({
  id,
  capaUrl,
  destino,
  tamanho = 'card',
  className,
}: {
  id: number
  capaUrl: string | null
  destino: string
  tamanho?: 'card' | 'hero'
  className?: string
}) {
  const [lugar, ...resto] = destino.split(',').map((p) => p.trim())
  const regiao = resto.join(', ')

  return (
    <div className={cn('relative overflow-hidden', fundos[id % fundos.length], className)}>
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 text-white',
          tamanho === 'hero' ? 'px-5 pb-10 sm:px-8 sm:pb-7' : 'px-4 pb-3',
        )}
        aria-hidden
      >
        <p
          className={cn(
            'font-bold tracking-tight text-balance',
            tamanho === 'hero' ? 'text-4xl leading-none sm:text-5xl' : 'line-clamp-1 text-2xl leading-tight',
          )}
        >
          {lugar}
        </p>
        {regiao && (
          <p className={cn('mt-1 text-white/80', tamanho === 'hero' ? 'text-base' : 'line-clamp-1 text-sm')}>{regiao}</p>
        )}
      </div>
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
