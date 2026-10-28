import { Archive, Plane, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/button-class'
import { tripStatus } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTrips, type Trip } from './api'
import { TripCard } from './TripCard'

export function TripsPage() {
  const [arquivadas, setArquivadas] = useState(false)
  const { data: trips, isPending, error } = useTrips(arquivadas)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Minhas viagens</h1>
        <Link to="/viagens/nova" className={buttonClass()}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova viagem</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </div>

      <div className="mb-6 inline-flex rounded-lg bg-slate-200/70 p-1 text-sm">
        {[
          { valor: false, label: 'Ativas' },
          { valor: true, label: 'Arquivadas' },
        ].map((aba) => (
          <button
            key={aba.label}
            onClick={() => setArquivadas(aba.valor)}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium text-slate-600',
              arquivadas === aba.valor && 'bg-white text-slate-900 shadow-sm',
            )}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="text-slate-500">Carregando…</p>
      ) : error ? (
        <p className="text-red-600">{error.message}</p>
      ) : trips.length === 0 ? (
        <EmptyState arquivadas={arquivadas} />
      ) : arquivadas ? (
        <TripGrid trips={trips} />
      ) : (
        <ActiveTrips trips={trips} />
      )}
    </div>
  )
}

function ActiveTrips({ trips }: { trips: Trip[] }) {
  const proximas = trips.filter((t) => tripStatus(t.dataInicio, t.dataFim).tipo !== 'concluida')
  // As que já aconteceram aparecem da mais recente para a mais antiga.
  const passadas = trips.filter((t) => tripStatus(t.dataInicio, t.dataFim).tipo === 'concluida').reverse()

  return (
    <div className="space-y-8">
      {proximas.length > 0 && <TripGrid trips={proximas} />}
      {passadas.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium tracking-wide text-slate-500 uppercase">Já aconteceram</h2>
          <TripGrid trips={passadas} />
        </section>
      )}
    </div>
  )
}

function TripGrid({ trips }: { trips: Trip[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((t) => (
        <TripCard key={t.id} trip={t} />
      ))}
    </div>
  )
}

function EmptyState({ arquivadas }: { arquivadas: boolean }) {
  const Icon = arquivadas ? Archive : Plane
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" />
      </div>
      {arquivadas ? (
        <>
          <h2 className="text-lg font-medium">Nenhuma viagem arquivada</h2>
          <p className="mt-1 max-w-xs text-sm text-slate-500">Viagens arquivadas aparecem aqui.</p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-medium">Nenhuma viagem ainda</h2>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Crie sua primeira viagem para começar a planejar o roteiro, o orçamento e a bagagem.
          </p>
          <Link to="/viagens/nova" className={cn(buttonClass(), 'mt-6')}>
            <Plus className="size-4" />
            Criar viagem
          </Link>
        </>
      )}
    </div>
  )
}
