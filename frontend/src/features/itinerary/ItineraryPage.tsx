import { Lightbulb, List, Map as MapIcon, Plus, Sparkles } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Fab } from '@/components/ui/fab'
import { PageSkeleton } from '@/components/ui/skeleton'
import { AiDayDialog, AiItineraryDialog } from '@/features/ai/AiItineraryDialogs'
import { useTrip } from '@/features/trips/api'
import { todayIso } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useActivities, useReorderActivities } from './api'
import { ActivityDialog, type ActivityDialogState } from './ActivityDialog'
import { DayJumper } from './DayJumper'
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
  const [iaRoteiro, setIaRoteiro] = useState(false)
  /** undefined = fechado; null = Ideias */
  const [iaDia, setIaDia] = useState<string | null | undefined>(undefined)
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

  const hoje = todayIso()
  const temHoje = datas.includes(hoje)
  const carregado = !!activities.data

  // Durante a viagem, abre direto no dia de hoje.
  useEffect(() => {
    if (carregado && temHoje) document.getElementById(`dia-${hoje}`)?.scrollIntoView({ block: 'start' })
  }, [carregado, temHoje, hoje])

  if (trip.isPending || activities.isPending) return <PageSkeleton />
  if (trip.error || activities.error) {
    return <p className="text-red-600">{(trip.error ?? activities.error)?.message}</p>
  }

  const moeda = trip.data.moeda
  const semCoordenadas = gruposMapa.every((g) => g.atividades.every((a) => a.lat == null))

  const verNoMapa = (chave: string) => {
    setDiaMapa(chave)
    setVisao('mapa')
  }

  const adicionar = () => setDialog({ data: temHoje ? hoje : (datas[0] ?? null) })
  const comAtividades = grupos.dias.filter((d) => d.atividades.length > 0).length

  return (
    <div>
      <PageHeader
        title="Roteiro"
        description={`${comAtividades} de ${grupos.dias.length} ${grupos.dias.length === 1 ? 'dia planejado' : 'dias planejados'}`}
        actions={
          <>
            <Button variant="outline" className="h-10 px-3" onClick={() => setIaRoteiro(true)}>
              <Sparkles className="size-4" />
              Sugerir com IA
            </Button>
            <Button className="hidden h-10 sm:inline-flex" onClick={adicionar}>
              <Plus className="size-4" />
              Atividade
            </Button>
          </>
        }
      />

      <div className="mb-3 inline-flex rounded-lg bg-slate-200/70 p-1 text-sm lg:hidden" role="tablist" aria-label="Visualização">
        {(
          [
            ['lista', 'Lista', List],
            ['mapa', 'Mapa', MapIcon],
          ] as const
        ).map(([valor, label, Icon]) => (
          <button
            key={valor}
            role="tab"
            aria-selected={visao === valor}
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
        <div className={cn(visao === 'mapa' && 'hidden lg:block')}>
          {grupos.dias.length > 1 && (
            <DayJumper
              alvos={[
                ...grupos.dias.map((d) => ({
                  id: `dia-${d.data}`,
                  label: `Dia ${d.numero}`,
                  sublabel: d.data === hoje ? 'Hoje' : formatShortDay(d.data!),
                  preenchido: d.atividades.length > 0,
                })),
                { id: 'ideias', label: 'Ideias', sublabel: String(grupos.ideias.atividades.length), preenchido: false },
              ]}
            />
          )}
          <div className="space-y-6">
          {grupos.dias.map((d) => (
            <DaySection
              key={d.data}
              id={`dia-${d.data}`}
              titulo={`Dia ${d.numero}`}
              subtitulo={formatDay(d.data!)}
              hoje={d.data === hoje}
              atividades={d.atividades}
              moeda={moeda}
                            onAdd={() => setDialog({ data: d.data })}
              onEdit={(a) => setDialog({ activity: a })}
              onReorder={(ids) => reorder.mutate({ data: d.data, ids })}
              onShowMap={() => verNoMapa(d.data!)}
              onSuggest={() => setIaDia(d.data)}
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
            vazio="Anote lugares que vocês querem conhecer e decidam o dia depois."
            onAdd={() => setDialog({ data: null })}
            onEdit={(a) => setDialog({ activity: a })}
            onReorder={(ids) => reorder.mutate({ data: null, ids })}
            onShowMap={() => verNoMapa(IDEIAS)}
            onSuggest={() => setIaDia(null)}
          />

          {grupos.foraDasDatas.length > 0 && (
            <DaySection
              id="fora"
              titulo="Fora das datas da viagem"
              subtitulo="As datas da viagem mudaram. Edite para escolher um novo dia."
              atividades={grupos.foraDasDatas}
              moeda={moeda}
              onEdit={(a) => setDialog({ activity: a })}
            />
          )}

          {reorder.error && <p className="text-sm text-red-600">{reorder.error.message}</p>}
          </div>
        </div>

        <div className={cn('lg:block', visao === 'lista' && 'hidden')}>
          <div className="space-y-3 lg:sticky lg:top-32">
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
            <div className="relative isolate h-[65dvh] overflow-hidden rounded-xl ring-1 ring-slate-200 lg:h-[calc(100dvh-11rem)]">
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

      {visao === 'lista' && (
        <Fab aria-label="Adicionar atividade" onClick={adicionar}>
          <Plus className="size-6" />
        </Fab>
      )}

      <ActivityDialog trip={trip.data} datas={datas} state={dialog} onClose={() => setDialog(null)} />
      <AiItineraryDialog trip={trip.data} open={iaRoteiro} onClose={() => setIaRoteiro(false)} />
      <AiDayDialog trip={trip.data} data={iaDia} onClose={() => setIaDia(undefined)} />
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
