import { Link } from 'react-router'
import { AvatarGroup } from '@/components/ui/avatar'
import { Postmark } from '@/components/ui/postmark'
import { formatDateRange, formatStatus, parseDate, tripStatus, type TripStatus } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Trip } from './api'
import { TripCover } from './TripCover'

/** Viagem na grade: um selo, com a capa dentro da moldura picotada. */
export function TripCard({ trip }: { trip: Trip }) {
  const status = tripStatus(trip.dataInicio, trip.dataFim)

  return (
    <Link
      to={`/viagens/${trip.id}`}
      className="group stamp block transition-transform duration-150 hover:-rotate-1 focus-visible:-rotate-1"
    >
      <TripCover id={trip.id} capaUrl={trip.capaUrl} destino={trip.destino} className="h-32" />
      <div className="space-y-1 px-2 pt-3 pb-1">
        <h3 className="text-lg leading-tight font-semibold text-pretty group-hover:text-primary">{trip.titulo}</h3>
        <div className="flex items-end justify-between gap-2 pt-1">
          <p className="text-sm text-slate-600">
            <span className="label-mono block text-slate-500">{formatDateRange(trip.dataInicio, trip.dataFim)}</span>
            {status.tipo !== 'concluida' && (
              <span className={cn('mt-0.5 block font-medium', status.tipo === 'andamento' ? 'text-tomato-ink' : 'text-slate-700')}>
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

const mesCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

/** A viagem em andamento ou a próxima: um cartão-postal inteiro, frente e verso, com carimbo e contagem. */
export function NextTripCard({ trip }: { trip: Trip }) {
  const status = tripStatus(trip.dataInicio, trip.dataFim)
  const { numero, legenda } = contagem(status)
  const inicio = parseDate(trip.dataInicio)

  return (
    <Link
      to={`/viagens/${trip.id}`}
      className="group grid overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-slate-200 transition-shadow hover:shadow-lift sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <TripCover
        id={trip.id}
        capaUrl={trip.capaUrl}
        destino={trip.destino}
        tamanho="hero"
        className="h-48 sm:h-auto sm:min-h-72"
      />
      <div className="relative flex flex-col p-5 sm:border-l sm:border-dashed sm:border-slate-300 sm:p-6">
        <Postmark
          topo={trip.destino.split(',')[0]}
          linhas={['partida', mesCurto.format(inicio).replace('.', '').replace(' de ', ' '), String(inicio.getFullYear())]}
          className="absolute right-2 bottom-16 w-40 -rotate-12 text-tomato/60 sm:top-3 sm:bottom-auto"
        />
        <p className="label-mono text-tomato-ink">{status.tipo === 'andamento' ? 'Acontecendo agora' : 'Próxima viagem'}</p>
        <h2 className="mt-2 text-2xl leading-tight font-semibold group-hover:text-primary sm:pr-36">
          {trip.titulo}
        </h2>

        <div className="ruled mt-3 text-sm leading-8 text-slate-600">
          <p>{formatDateRange(trip.dataInicio, trip.dataFim)}</p>
          <p className="truncate">{trip.membros.map((m) => m.nome.split(' ')[0]).join(' e ')}</p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 sm:mt-auto sm:pt-8">
          <p>
            <span
              className="block font-display text-6xl leading-none font-semibold text-tomato italic tabular-nums"
              style={{ fontVariationSettings: "'SOFT' 100" }}
            >
              {numero}
            </span>
            <span className="label-mono mt-2 block text-slate-500">{legenda}</span>
          </p>
          <AvatarGroup pessoas={trip.membros} />
        </div>
      </div>
    </Link>
  )
}
