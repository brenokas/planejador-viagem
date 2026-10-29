import { Link } from 'react-router'
import { AvatarGroup } from '@/components/ui/avatar'
import { formatDateRange, formatStatus, tripStatus, type TripStatus } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Trip } from './api'
import { TripCover } from './TripCover'

export function TripCard({ trip }: { trip: Trip }) {
  const status = tripStatus(trip.dataInicio, trip.dataFim)

  return (
    <Link
      to={`/viagens/${trip.id}`}
      className="group block overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition-colors hover:ring-slate-400"
    >
      <TripCover id={trip.id} capaUrl={trip.capaUrl} destino={trip.destino} className="h-28" />
      <div className="space-y-1 p-4">
        <h3 className="font-semibold leading-tight text-pretty group-hover:text-primary">{trip.titulo}</h3>
        {trip.capaUrl && <p className="truncate text-sm text-slate-600">{trip.destino}</p>}
        <div className="flex items-center justify-between gap-2 pt-2">
          <p className="text-sm text-slate-500">
            {formatDateRange(trip.dataInicio, trip.dataFim)}
            {status.tipo !== 'concluida' && (
              <span className={cn('block font-medium', status.tipo === 'andamento' ? 'text-primary' : 'text-slate-700')}>
                {formatStatus(status)}
              </span>
            )}
          </p>
          <AvatarGroup pessoas={trip.membros} />
        </div>
      </div>
    </Link>
  )
}

function contagem(status: TripStatus): { numero: string; legenda: string } {
  if (status.tipo === 'andamento') return { numero: `Dia ${status.dia}`, legenda: `de ${status.total} da viagem` }
  if (status.tipo === 'futura' && status.faltam === 1) return { numero: 'Amanhã', legenda: 'é o embarque' }
  if (status.tipo === 'futura') return { numero: String(status.faltam), legenda: 'dias para embarcar' }
  return { numero: '', legenda: '' }
}

/** A viagem em andamento ou a próxima: ocupa a largura toda, com a contagem em destaque. */
export function NextTripCard({ trip }: { trip: Trip }) {
  const status = tripStatus(trip.dataInicio, trip.dataFim)
  const { numero, legenda } = contagem(status)

  return (
    <Link
      to={`/viagens/${trip.id}`}
      className="group grid overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition-colors hover:ring-slate-400 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <TripCover
        id={trip.id}
        capaUrl={trip.capaUrl}
        destino={trip.destino}
        tamanho="hero"
        className="h-44 sm:h-auto sm:min-h-64"
      />
      <div className="flex flex-col p-5 sm:p-6">
        <p className="text-sm font-medium text-slate-500">{status.tipo === 'andamento' ? 'Acontecendo agora' : 'Próxima viagem'}</p>
        <h2 className="mt-1 text-xl leading-tight font-semibold group-hover:text-primary">{trip.titulo}</h2>
        <p className="mt-1 text-sm text-slate-600">{formatDateRange(trip.dataInicio, trip.dataFim)}</p>

        <div className="mt-6 flex items-end justify-between gap-4 sm:mt-auto sm:pt-8">
          <p>
            <span className="block font-display text-5xl leading-none font-semibold tracking-tight text-primary tabular-nums">
              {numero}
            </span>
            <span className="mt-1 block text-sm text-slate-600">{legenda}</span>
          </p>
          <AvatarGroup pessoas={trip.membros} />
        </div>
      </div>
    </Link>
  )
}
