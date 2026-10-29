import { cn } from '@/lib/utils'

// Tintas de cartão-postal antigo; o creme do texto passa em contraste AA em todas.
const fundos = ['bg-[#1e4b8f]', 'bg-[#b03a22]', 'bg-[#2f5d5a]', 'bg-[#8a5a12]', 'bg-[#6b3b7a]', 'bg-[#4f6328]']

/**
 * Capa da viagem, como a frente de um cartão-postal: a foto informada ou, sem foto,
 * uma cor fixa por viagem com o nome do destino em letra de cartaz.
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
  const hero = tamanho === 'hero'

  return (
    <div className={cn('relative isolate overflow-hidden', fundos[id % fundos.length], className)}>
      {capaUrl && (
        <img
          src={capaUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-10 size-full object-cover sepia-[.25] saturate-[.85]"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      {capaUrl && <div className="absolute inset-0 -z-10 bg-linear-to-t from-slate-900/70 via-slate-900/10 to-transparent" />}
      {/* Fio interno, como a margem impressa de um postal. */}
      <div className={cn('pointer-events-none absolute border border-white/35', hero ? 'inset-3 sm:inset-4' : 'inset-2')} />
      <div
        className={cn('absolute inset-x-0 bottom-0 text-white', hero ? 'px-6 pb-10 sm:px-9 sm:pb-8' : 'px-4 pb-3.5')}
        aria-hidden
      >
        {regiao && <p className={cn('label-mono text-white/80', hero ? 'mb-1' : 'line-clamp-1 text-[11px]')}>{regiao}</p>}
        <p
          className={cn(
            'font-display font-semibold italic text-balance',
            hero ? 'text-5xl leading-[0.95] sm:text-6xl' : 'line-clamp-1 text-3xl leading-tight',
          )}
          style={{ fontVariationSettings: "'SOFT' 100" }}
        >
          {lugar}
        </p>
      </div>
    </div>
  )
}
