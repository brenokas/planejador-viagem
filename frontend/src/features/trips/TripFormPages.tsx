import { useNavigate, useParams } from 'react-router'
import { PageSkeleton } from '@/components/ui/skeleton'
import { useCreateTrip, useTrip, useUpdateTrip } from './api'
import { TripForm } from './TripForm'

export function NewTripPage() {
  const navigate = useNavigate()
  const create = useCreateTrip()

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Nova viagem</h1>
      <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <TripForm
          submitLabel="Criar viagem"
          pending={create.isPending}
          error={create.error}
          onCancel={() => navigate(-1)}
          onSubmit={(input, { onError }) =>
            create.mutate(input, {
              onSuccess: (trip) => navigate(`/viagens/${trip.id}`, { replace: true }),
              onError,
            })
          }
        />
      </div>
    </div>
  )
}

export function EditTripPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const { data: trip, isPending, error } = useTrip(id)
  const update = useUpdateTrip(id)

  if (isPending) return <PageSkeleton />
  if (error) return <p className="text-red-600">{error.message}</p>

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Editar viagem</h1>
      <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <TripForm
          key={trip.version}
          trip={trip}
          submitLabel="Salvar"
          pending={update.isPending}
          error={update.error}
          onCancel={() => navigate(-1)}
          onSubmit={(input, { onError }) =>
            update.mutate(input, {
              onSuccess: () => navigate(`/viagens/${id}`, { replace: true }),
              onError,
            })
          }
        />
      </div>
    </div>
  )
}
