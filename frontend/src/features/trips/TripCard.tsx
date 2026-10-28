import { CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { AvatarGroup } from '@/components/ui/avatar'
import { formatDateRange, formatStatus, tripStatus } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Trip } from './api'
import { TripCover } from './TripCover'

export function TripCard({ trip }: { trip: Trip }) {
  const status = tripStatus(trip.dataInicio, trip.dataFim)

  return (
    <Link
      to={`/viagens/${trip.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
    >
      <TripCover id={trip.id} capaUrl={trip.capaUrl} className="h-28" />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight group-hover:text-primary">{trip.titulo}</h3>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              status.tipo === 'andamento' && 'bg-primary text-white',
              status.tipo === 'futura' && 'bg-primary/10 text-primary',
              status.tipo === 'concluida' && 'bg-slate-100 text-slate-500',
            )}
          >
            {formatStatus(status)}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{trip.destino}</span>
        </p>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarDays className="size-4 shrink-0" />
            {formatDateRange(trip.dataInicio, trip.dataFim)}
          </p>
          <AvatarGroup pessoas={trip.membros} />
        </div>
      </div>
    </Link>
  )
}
