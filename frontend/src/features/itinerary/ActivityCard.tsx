import { GripVertical, MapPin, Navigation, StickyNote } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Activity } from './api'
import { CATEGORIAS } from './categories'
import { formatTime, googleMapsUrl } from './days'

export function ActivityCard({
  activity,
  numero,
  moeda,
  onClick,
  handleProps,
  dragging,
}: {
  activity: Activity
  numero?: number
  moeda: string
  onClick: () => void
  handleProps?: HTMLAttributes<HTMLButtonElement>
  dragging?: boolean
}) {
  const cat = CATEGORIAS[activity.categoria]
  const Icon = cat.icon
  const inicio = formatTime(activity.horaInicio)
  const fim = formatTime(activity.horaFim)
  const mapa = googleMapsUrl(activity)
  const temCoordenadas = activity.lat != null

  return (
    <div
      className={cn(
        'flex items-stretch gap-1 rounded-xl bg-white shadow-sm ring-1 ring-slate-200',
        dragging && 'shadow-lg ring-primary',
      )}
    >
      {handleProps && (
        <button
          type="button"
          aria-label="Arrastar para reordenar"
          className="flex w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-l-xl text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          {...handleProps}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <button type="button" onClick={onClick} className={cn('flex min-w-0 flex-1 gap-3 py-3 pr-3 text-left', !handleProps && 'pl-3')}>
        <div className="flex w-12 shrink-0 flex-col items-center gap-1">
          <span className={cn('flex size-9 items-center justify-center rounded-full', cat.classe)}>
            <Icon className="size-4" />
          </span>
          {inicio && <span className="text-xs font-medium text-slate-600">{inicio}</span>}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium leading-snug">
            {temCoordenadas && numero != null && (
              <span className="mr-1.5 inline-flex size-5 items-center justify-center rounded-full bg-slate-800 align-text-bottom text-[10px] text-white">
                {numero}
              </span>
            )}
            {activity.titulo}
          </p>
          {activity.localNome && (
            <p className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{activity.localNome}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {inicio && fim && (
              <span>
                {inicio}–{fim}
              </span>
            )}
            {activity.custoCentavos != null && <span>{formatMoney(activity.custoCentavos, moeda)}</span>}
            {activity.notas && (
              <span className="flex items-center gap-1">
                <StickyNote className="size-3" /> notas
              </span>
            )}
          </div>
        </div>
      </button>
      {mapa && (
        <a
          href={mapa}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir no Google Maps"
          title="Abrir no Google Maps"
          className="flex w-10 shrink-0 items-center justify-center rounded-r-xl text-slate-400 hover:bg-slate-50 hover:text-primary"
        >
          <Navigation className="size-4" />
        </a>
      )}
    </div>
  )
}
