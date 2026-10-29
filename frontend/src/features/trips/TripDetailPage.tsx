import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AvatarGroup } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Menu, MenuItem } from '@/components/ui/menu'
import { useActivities } from '@/features/itinerary/api'
import { useMe } from '@/features/auth/api'
import { useChecklist, type ChecklistItem } from '@/features/checklist/api'
import { useOnline } from '@/features/realtime/presence'
import { useExpenseSummary, type Summary } from '@/features/expenses/api'
import { formatDateRange, formatMoney, formatStatus, tripDays, tripStatus } from '@/lib/format'
import { useArchiveTrip, useDeleteTrip, useTrip } from './api'
import { InviteDialog } from './InviteDialog'
import { MembersDialog } from './MembersDialog'
import { TripCover } from './TripCover'

function resumoRoteiro(total: number | undefined) {
  if (!total) return 'Atividades dia a dia e mapa'
  return total === 1 ? '1 atividade planejada' : `${total} atividades planejadas`
}

function resumoChecklist(itens: ChecklistItem[] | undefined) {
  if (!itens?.length) return 'Bagagem e tarefas'
  return `${itens.filter((i) => i.feito).length} de ${itens.length} itens prontos`
}

function resumoOrcamento(resumo: Summary | undefined) {
  if (!resumo || resumo.totalGastoCentavos === 0) return 'Despesas e quem deve quanto'
  return `${formatMoney(resumo.totalGastoCentavos, resumo.moeda)} gastos`
}

export function TripDetailPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const { data: trip, isPending, error } = useTrip(id)
  const archive = useArchiveTrip(id)
  const remove = useDeleteTrip(id)
  const atividades = useActivities(id)
  const resumo = useExpenseSummary(id)
  const checklist = useChecklist(id)
  const online = useOnline()
  const { data: me } = useMe()
  const [convidar, setConvidar] = useState(false)
  const [participantes, setParticipantes] = useState(false)

  if (isPending) return <p className="text-slate-500">Carregando…</p>
  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">{error.message}</p>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          Voltar para as viagens
        </Link>
      </div>
    )
  }

  const souDono = trip.meuPapel === 'DONO'
  const outrosOnline = trip.membros.filter((m) => m.id !== me?.id && online.includes(m.id))
  const dias = tripDays(trip.dataInicio, trip.dataFim)

  const handleDelete = () => {
    if (!window.confirm(`Excluir "${trip.titulo}"? Isso apaga tudo da viagem e não pode ser desfeito.`)) return
    remove.mutate(undefined, { onSuccess: () => navigate('/', { replace: true }) })
  }

  return (
    <div className="-mx-4 -mt-6 sm:mx-0">
      <div className="relative">
        <TripCover
          id={trip.id}
          capaUrl={trip.capaUrl}
          destino={trip.destino}
          tamanho="hero"
          className="h-44 sm:h-56 sm:rounded-xl"
        />
        <div className="absolute inset-x-0 top-0 flex justify-between p-3">
          <Link
            to="/"
            className="rounded-lg bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <Menu trigger={<MoreVertical className="size-5" />}>
            {(close) => (
              <>
                <MenuItem
                  onClick={() => {
                    close()
                    navigate(`/viagens/${id}/editar`)
                  }}
                >
                  <Pencil className="size-4" /> Editar
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    close()
                    archive.mutate(!trip.arquivada)
                  }}
                >
                  {trip.arquivada ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                  {trip.arquivada ? 'Desarquivar' : 'Arquivar'}
                </MenuItem>
                {souDono && (
                  <MenuItem
                    danger
                    onClick={() => {
                      close()
                      handleDelete()
                    }}
                  >
                    <Trash2 className="size-4" /> Excluir viagem
                  </MenuItem>
                )}
              </>
            )}
          </Menu>
        </div>
      </div>

      <div className="relative -mt-6 space-y-6 rounded-t-3xl bg-slate-50 px-4 pt-6 sm:mt-8 sm:max-w-2xl sm:rounded-none sm:bg-transparent sm:px-0 sm:pt-0">
        <div className="space-y-3">
          {trip.arquivada && (
            <span className="inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Arquivada
            </span>
          )}
          <div>
            <p className="text-sm font-medium text-primary">{formatStatus(tripStatus(trip.dataInicio, trip.dataFim))}</p>
            <h1 className="text-3xl leading-tight font-semibold">{trip.titulo}</h1>
          </div>
          <div className="space-y-1.5 text-sm text-slate-600">
            {trip.capaUrl && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" /> {trip.destino}
              </p>
            )}
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0" />
              {formatDateRange(trip.dataInicio, trip.dataFim)} · {dias} {dias === 1 ? 'dia' : 'dias'}
            </p>
            {trip.orcamentoCentavos != null && (
              <p className="flex items-center gap-2">
                <Wallet className="size-4 shrink-0" /> Orçamento: {formatMoney(trip.orcamentoCentavos, trip.moeda)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setParticipantes(true)} className="flex items-center gap-3 text-left">
            <AvatarGroup pessoas={trip.membros} online={outrosOnline.map((m) => m.id)} />
            <span className="text-sm text-slate-600">
              {trip.membros.length === 1
                ? 'Só você por enquanto'
                : trip.membros.map((m) => m.nome.split(' ')[0]).join(' e ')}
              {outrosOnline.length > 0 && (
                <span className="block text-xs text-emerald-700">
                  {outrosOnline.map((m) => m.nome.split(' ')[0]).join(' e ')}{' '}
                  {outrosOnline.length === 1 ? 'está' : 'estão'} com a viagem aberta agora
                </span>
              )}
            </span>
          </button>
          <Button variant="outline" className="h-9 px-3" onClick={() => setConvidar(true)}>
            <UserPlus className="size-4" />
            <span className="sr-only sm:not-sr-only">Convidar</span>
          </Button>
        </div>

        {(archive.error || remove.error) && (
          <p className="text-sm text-red-600">{(archive.error ?? remove.error)?.message}</p>
        )}

        <nav aria-label="Partes da viagem" className="divide-y divide-slate-200 border-y border-slate-200">
          <Section title="Roteiro" description={resumoRoteiro(atividades.data?.length)} to={`/viagens/${id}/roteiro`} />
          <Section title="Orçamento" description={resumoOrcamento(resumo.data)} to={`/viagens/${id}/orcamento`} />
          <Section title="Checklist" description={resumoChecklist(checklist.data)} to={`/viagens/${id}/checklist`} />
          <Section
            title="Assistente"
            description="Pergunte à IA sobre o destino, com o roteiro e o orçamento de vocês em mãos"
            to={`/viagens/${id}/assistente`}
          />
        </nav>
      </div>

      <InviteDialog trip={trip} open={convidar} onClose={() => setConvidar(false)} />
      <MembersDialog
        trip={trip}
        open={participantes}
        onClose={() => setParticipantes(false)}
        onInvite={() => setConvidar(true)}
      />
    </div>
  )
}

function Section({ title, description, to }: { title: string; description: string; to: string }) {
  return (
    <Link to={to} className="group flex items-center gap-4 py-4 transition-colors hover:bg-slate-100 sm:px-2">
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl font-semibold tracking-tight group-hover:text-primary">{title}</p>
        <p className="text-sm text-pretty text-slate-600">{description}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
