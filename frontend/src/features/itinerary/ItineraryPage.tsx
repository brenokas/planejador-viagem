import { ArrowLeft, Lightbulb, List, Map as MapIcon, Plus } from 'lucide-react'
import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useTrip } from '@/features/trips/api'
import { cn } from '@/lib/utils'
import { useActivities, useReorderActivities } from './api'
import { ActivityDialog, type ActivityDialogState } from './ActivityDialog'
import { DaySection } from './DaySection'
import { formatDay, formatShortDay, groupByDay, tripDates } from './days'
import type { MapGroup } from './ItineraryMap'

const ItineraryMap = lazy(() => import('./ItineraryMap'))

const CORES_DIAS = ['#0d9488', '#e11d48', '#6366f1', '#f59e0b', '#0284c7', '#a855f7', '#16a34a', '#db2777']
const COR_IDEIAS = '#94a3b8'
const TODOS = 'todos'
const IDEIAS = 'ideias'

export function ItineraryPage() {
  const tripId = Number(useParams().id)
  const trip = useTrip(tripId)
  const activities = useActivities(tripId)
  const reorder = useReorderActivities(tripId)
  const [dialog, setDialog] = useState<ActivityDialogState>(null)
  const [visao, setVisao] = useState<'lista' | 'mapa'>('lista')
  const [diaMapa, setDiaMapa] = useState<string>(TODOS)

  const datas = useMemo(
    () => (trip.data ? tripDates(trip.data.dataInicio, trip.data.dataFim) : []),
    [trip.data],
  )
  const grupos = useMemo(() => groupByDay(activities.data ?? [], datas), [activities.data, datas])

  const gruposMapa: MapGroup[] = useMemo(() => {
    const dias = grupos.dias.map((d, i) => ({
      chave: d.data!,
      titulo: `Dia ${d.numero} · ${formatDay(d.data!)}`,
      cor: CORES_DIAS[i % CORES_DIAS.length],
      atividades: d.atividades,
      ligar: true,
    }))
    const ideias = { chave: IDEIAS, titulo: 'Ideias', cor: COR_IDEIAS, atividades: grupos.ideias.atividades, ligar: false }
    if (diaMapa === TODOS) return [...dias, ideias]
    if (diaMapa === IDEIAS) return [ideias]
    return dias.filter((d) => d.chave === diaMapa)
  }, [grupos, diaMapa])

  if (trip.isPending || activities.isPending) return <p className="text-slate-500">Carregando…</p>
  if (trip.error || activities.error) {
    return <p className="text-red-600">{(trip.error ?? activities.error)?.message}</p>
  }

  const moeda = trip.data.moeda
  const semCoordenadas = gruposMapa.every((g) => g.atividades.every((a) => a.lat == null))

  const verNoMapa = (chave: string) => {
    setDiaMapa(chave)
    setVisao('mapa')
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          to={`/viagens/${tripId}`}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Voltar para a viagem"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">Roteiro</h1>
          <p className="truncate text-sm text-slate-500">{trip.data.titulo}</p>
        </div>
        <Button className="h-10" onClick={() => setDialog({ data: datas[0] ?? null })}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Atividade</span>
        </Button>
      </div>

      <div className="mb-4 inline-flex rounded-lg bg-slate-200/70 p-1 text-sm lg:hidden">
        {(
          [
            ['lista', 'Lista', List],
            ['mapa', 'Mapa', MapIcon],
          ] as const
        ).map(([valor, label, Icon]) => (
          <button
            key={valor}
            onClick={() => setVisao(valor)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-slate-600',
              visao === valor && 'bg-white text-slate-900 shadow-sm',
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        <div className={cn('space-y-6', visao === 'mapa' && 'hidden lg:block')}>
          {grupos.dias.map((d) => (
            <DaySection
              key={d.data}
              id={`dia-${d.data}`}
              titulo={`Dia ${d.numero}`}
              subtitulo={formatDay(d.data!)}
              atividades={d.atividades}
              moeda={moeda}
              vazio="Nada planejado ainda. Toque para adicionar."
              onAdd={() => setDialog({ data: d.data })}
              onEdit={(a) => setDialog({ activity: a })}
              onReorder={(ids) => reorder.mutate({ data: d.data, ids })}
              onShowMap={() => verNoMapa(d.data!)}
            />
          ))}

          <DaySection
            id="ideias"
            titulo={
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb className="size-4 text-amber-500" aria-hidden /> Ideias
              </span>
            }
            subtitulo="Coisas para fazer, ainda sem dia definido"
            atividades={grupos.ideias.atividades}
            moeda={moeda}
            vazio="Anote aqui lugares que vocês querem conhecer."
            onAdd={() => setDialog({ data: null })}
            onEdit={(a) => setDialog({ activity: a })}
            onReorder={(ids) => reorder.mutate({ data: null, ids })}
            onShowMap={() => verNoMapa(IDEIAS)}
          />

          {grupos.foraDasDatas.length > 0 && (
            <DaySection
              id="fora"
              titulo="Fora das datas da viagem"
              subtitulo="As datas da viagem mudaram. Edite para escolher um novo dia."
              atividades={grupos.foraDasDatas}
              moeda={moeda}
              vazio=""
              onEdit={(a) => setDialog({ activity: a })}
            />
          )}

          {reorder.error && <p className="text-sm text-red-600">{reorder.error.message}</p>}
        </div>

        <div className={cn('lg:block', visao === 'lista' && 'hidden')}>
          <div className="space-y-3 lg:sticky lg:top-20">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              <Chip ativo={diaMapa === TODOS} onClick={() => setDiaMapa(TODOS)}>
                Todos
              </Chip>
              {grupos.dias.map((d, i) => (
                <Chip key={d.data} ativo={diaMapa === d.data} cor={CORES_DIAS[i % CORES_DIAS.length]} onClick={() => setDiaMapa(d.data!)}>
                  Dia {d.numero} · {formatShortDay(d.data!)}
                </Chip>
              ))}
              <Chip ativo={diaMapa === IDEIAS} cor={COR_IDEIAS} onClick={() => setDiaMapa(IDEIAS)}>
                Ideias
              </Chip>
            </div>
            <div className="relative isolate h-[65dvh] overflow-hidden rounded-2xl ring-1 ring-slate-200 lg:h-[calc(100dvh-10rem)]">
              {semCoordenadas ? (
                <div className="flex size-full flex-col items-center justify-center bg-white px-6 text-center text-sm text-slate-500">
                  <MapIcon className="mb-3 size-8 text-slate-300" />
                  Nenhuma atividade com local marcado aqui. Ao adicionar uma atividade, escolha uma sugestão no campo
                  “Local” para ela aparecer no mapa.
                </div>
              ) : (
                <Suspense fallback={<div className="flex size-full items-center justify-center bg-white text-slate-500">Carregando mapa…</div>}>
                  <ItineraryMap grupos={gruposMapa} />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>

      <ActivityDialog trip={trip.data} datas={datas} state={dialog} onClose={() => setDialog(null)} />
    </div>
  )
}

function Chip({
  ativo,
  cor,
  onClick,
  children,
}: {
  ativo: boolean
  cor?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap ring-1',
        ativo ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
      )}
    >
      {cor && <span className="size-2.5 rounded-full" style={{ background: cor }} />}
      {children}
    </button>
  )
}
