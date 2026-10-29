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
        <p className="text-slate-700">{error.message}</p>
        <Link to="/" className={buttonClass('outline', 'mt-6 w-full')}>
          Ir para minhas viagens
        </Link>
      </AuthLayout>
    )
  }

  if (convite.jaMembro) return <Navigate to={`/viagens/${convite.tripId}`} replace />

  return (
    <AuthLayout title="Convite para uma viagem">
      <p className="text-slate-600">
        <strong className="text-slate-900">{convite.convidadoPor}</strong> chamou você para planejar junto:
      </p>
      <div className="my-6 rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <p className="font-display text-2xl leading-tight font-semibold tracking-tight">{convite.titulo}</p>
        <p className="mt-2 text-sm text-slate-600">{convite.destino}</p>
        <p className="text-sm text-slate-600">{formatDateRange(convite.dataInicio, convite.dataFim)}</p>
      </div>
      {accept.error && <p className="mb-3 text-sm text-red-600">{accept.error.message}</p>}
      <Button
        className="w-full"
        disabled={accept.isPending}
        onClick={() => accept.mutate(undefined, { onSuccess: (trip) => navigate(`/viagens/${trip.id}`, { replace: true }) })}
      >
        {accept.isPending ? 'Entrando…' : 'Aceitar convite'}
      </Button>
      <Link to="/" className="mt-4 block text-center text-sm text-slate-500 hover:underline">
        Agora não
      </Link>
    </AuthLayout>
  )
}
