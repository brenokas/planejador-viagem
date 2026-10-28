import { CalendarDays, MapPin, Plane } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-class'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { formatDateRange } from '@/lib/format'
import { useAcceptInvite, useInvitePreview } from './api'

export function InvitePage() {
  const token = useParams().token ?? ''
  const navigate = useNavigate()
  const { data: convite, isPending, error } = useInvitePreview(token)
  const accept = useAcceptInvite(token)

  if (isPending) return <AuthLayout title="Convite">Carregando…</AuthLayout>

  if (error) {
    return (
      <AuthLayout title="Convite">
        <p className="text-center text-slate-700">{error.message}</p>
        <Link to="/" className={buttonClass('outline', 'mt-6 w-full')}>
          Ir para minhas viagens
        </Link>
      </AuthLayout>
    )
  }

  if (convite.jaMembro) return <Navigate to={`/viagens/${convite.tripId}`} replace />

  return (
    <AuthLayout title="Você foi convidado!">
      <p className="text-center text-sm text-slate-600">
        <strong>{convite.convidadoPor}</strong> convidou você para planejar a viagem:
      </p>
      <div className="my-5 space-y-2 rounded-xl bg-slate-50 p-4">
        <p className="flex items-center gap-2 font-semibold">
          <Plane className="size-4 text-primary" /> {convite.titulo}
        </p>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="size-4" /> {convite.destino}
        </p>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <CalendarDays className="size-4" /> {formatDateRange(convite.dataInicio, convite.dataFim)}
        </p>
      </div>
      {accept.error && <p className="mb-3 text-sm text-red-600">{accept.error.message}</p>}
      <Button
        className="w-full"
        disabled={accept.isPending}
        onClick={() => accept.mutate(undefined, { onSuccess: (trip) => navigate(`/viagens/${trip.id}`, { replace: true }) })}
      >
        {accept.isPending ? 'Entrando…' : 'Aceitar convite'}
      </Button>
      <Link to="/" className="mt-3 block text-center text-sm text-slate-500 hover:underline">
        Agora não
      </Link>
    </AuthLayout>
  )
}
