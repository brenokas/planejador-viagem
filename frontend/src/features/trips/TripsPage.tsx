import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/button-class'
import { tripStatus } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTrips, type Trip } from './api'
import { NextTripCard, TripCard } from './TripCard'

export function TripsPage() {
  const [arquivadas, setArquivadas] = useState(false)
  const { data: trips, isPending, error } = useTrips(arquivadas)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-2">
        <h1 className="text-3xl font-semibold">Minhas viagens</h1>
        <Link to="/viagens/nova" className={buttonClass()}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova viagem</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </div>

      <div className="mb-6 inline-flex rounded-lg bg-slate-200/70 p-1 text-sm" role="tablist">
        {[
          { valor: false, label: 'Ativas' },
          { valor: true, label: 'Arquivadas' },
        ].map((aba) => (
          <button
            key={aba.label}
            role="tab"
            aria-selected={arquivadas === aba.valor}
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

  const [destaque, ...demais] = proximas

  return (
    <div className="space-y-10">
      {destaque && <NextTripCard trip={destaque} />}
      {demais.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Depois dessa</h2>
          <TripGrid trips={demais} />
        </section>
      )}
      {passadas.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-500">Já aconteceram</h2>
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
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12">
      {arquivadas ? (
        <>
          <h2 className="text-xl font-semibold">Nada arquivado</h2>
          <p className="mt-1 max-w-sm text-sm text-pretty text-slate-600">
            Quando uma viagem sair da lista principal pelo menu “Arquivar”, ela fica guardada aqui.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Para onde vocês vão?</h2>
          <p className="mt-1 max-w-sm text-sm text-pretty text-slate-600">
            Comece pelo destino e pelas datas. O roteiro, as contas e a mala vêm depois.
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
