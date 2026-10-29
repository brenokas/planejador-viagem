import { Archive, ArchiveRestore, CalendarDays, ChevronRight, MapPin, MoreVertical, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AvatarGroup } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Postmark } from '@/components/ui/postmark'
import { ProgressBar } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/use-confirm'
import { useMe } from '@/features/auth/api'
import { useChecklist, type ChecklistItem } from '@/features/checklist/api'
import { useExpenseSummary, type Summary } from '@/features/expenses/api'
import { useActivities, type Activity } from '@/features/itinerary/api'
import { formatTime } from '@/features/itinerary/days'
import { useOnline } from '@/features/realtime/presence'
import { formatDateRange, formatMoney, formatStatus, parseDate, todayIso, tripDays, tripStatus } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useArchiveTrip, useDeleteTrip, useTrip, type Trip } from './api'
import { InviteDialog } from './InviteDialog'
import { MembersDialog } from './MembersDialog'
import { TripCover } from './TripCover'

const diaMes = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

export function TripDetailPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const confirm = useConfirm()
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

  if (isPending) return <DetailSkeleton />
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
  const status = tripStatus(trip.dataInicio, trip.dataFim)
  const base = `/viagens/${id}`

  const handleDelete = async () => {
    const ok = await confirm({
      titulo: `Excluir "${trip.titulo}"?`,
      mensagem: 'Roteiro, despesas, checklist e conversa com o assistente serão apagados para os dois. Não dá para desfazer.',
      confirmar: 'Excluir viagem',
      perigo: true,
    })
    if (ok) remove.mutate(undefined, { onSuccess: () => navigate('/', { replace: true }) })
  }

  return (
    <div className="-mx-4 -mt-6 sm:mx-0 sm:mt-0">
      <div className="relative">
        <TripCover
          id={trip.id}
          capaUrl={trip.capaUrl}
          destino={trip.destino}
          tamanho="hero"
          className="h-48 sm:h-64 sm:rounded-xl"
        />
        <Postmark
          topo={trip.destino.split(',')[0]}
          linhas={['partida', diaMes.format(parseDate(trip.dataInicio)).replace('.', '').replace(' de ', ' '), String(parseDate(trip.dataInicio).getFullYear())]}
          className="absolute right-4 bottom-4 w-36 -rotate-12 text-white/60 sm:right-8 sm:bottom-6 sm:w-44"
        />
        <div className="absolute top-3 right-3">
          <Menu trigger={<MoreVertical className="size-5" />} label="Opções da viagem">
            {(close) => (
              <>
                <MenuItem
                  onClick={() => {
                    close()
                    navigate(`${base}/editar`)
                  }}
                >
                  <Pencil className="size-4" /> Editar viagem
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    close()
                    setConvidar(true)
                  }}
                >
                  <UserPlus className="size-4" /> Convidar
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

      <div className="space-y-6 px-4 pt-6 sm:px-0">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('label-mono', status.tipo === 'concluida' ? 'text-slate-500' : 'text-tomato-ink')}>
              {formatStatus(status)}
            </span>
            {trip.arquivada && (
              <span className="label-mono rounded-sm border border-slate-400 px-1.5 py-0.5 text-[10px] text-slate-600">Arquivada</span>
            )}
          </div>
          <h1 className="text-4xl leading-tight font-semibold">{trip.titulo}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
            <p className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" />
              {formatDateRange(trip.dataInicio, trip.dataFim)} · {dias} {dias === 1 ? 'dia' : 'dias'}
            </p>
            {trip.capaUrl && (
              <p className="flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" /> {trip.destino}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-card ring-1 ring-slate-200">
          <button onClick={() => setParticipantes(true)} className="flex min-w-0 items-center gap-3 text-left">
            <AvatarGroup pessoas={trip.membros} online={outrosOnline.map((m) => m.id)} />
            <span className="min-w-0 text-sm text-slate-700">
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
          {trip.membros.length === 1 ? (
            <Button className="h-9 shrink-0 px-3" onClick={() => setConvidar(true)}>
              <UserPlus className="size-4" /> Convidar
            </Button>
          ) : (
            <Button variant="ghost" className="h-9 shrink-0 px-2.5" onClick={() => setConvidar(true)} aria-label="Convidar">
              <UserPlus className="size-4" />
            </Button>
          )}
        </div>

        {(archive.error || remove.error) && (
          <p className="text-sm text-red-600">{(archive.error ?? remove.error)?.message}</p>
        )}

        {status.tipo === 'andamento' && atividades.data && <Today base={base} atividades={atividades.data} />}

        <div className="grid gap-3 sm:grid-cols-2">
          <ItineraryCard to={`${base}/roteiro`} trip={trip} atividades={atividades.data} />
          <BudgetCard to={`${base}/orcamento`} resumo={resumo.data} />
          <ChecklistCard to={`${base}/checklist`} itens={checklist.data} />
          <SummaryCard to={`${base}/assistente`} title="Assistente">
            <p className="text-sm text-pretty text-slate-600">
              Pergunte sobre {trip.destino.split(',')[0]}: o assistente conhece o roteiro e o orçamento de vocês.
            </p>
          </SummaryCard>
        </div>
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

function SummaryCard({ to, title, children }: { to: string; title: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-2 rounded-xl bg-white p-4 shadow-card ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-display text-xl font-semibold group-hover:text-primary">{title}</span>
        <ChevronRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
      </span>
      {children}
    </Link>
  )
}

function ItineraryCard({ to, trip, atividades }: { to: string; trip: Trip; atividades: Activity[] | undefined }) {
  const total = tripDays(trip.dataInicio, trip.dataFim)
  const comPlano = new Set(atividades?.filter((a) => a.data).map((a) => a.data)).size
  const ideias = atividades?.filter((a) => !a.data).length ?? 0
  return (
    <SummaryCard to={to} title="Roteiro">
      {!atividades?.length ? (
        <p className="text-sm text-slate-600">Nada planejado ainda. Monte o dia a dia ou peça sugestões à IA.</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            <strong className="font-semibold text-slate-900 tabular-nums">
              {comPlano} de {total}
            </strong>{' '}
            {total === 1 ? 'dia planejado' : 'dias planejados'}
            {ideias > 0 && ` · ${ideias} ${ideias === 1 ? 'ideia' : 'ideias'} sem dia`}
          </p>
          <ProgressBar value={(comPlano / total) * 100} label="Dias com atividades" />
        </>
      )}
    </SummaryCard>
  )
}

function BudgetCard({ to, resumo }: { to: string; resumo: Summary | undefined }) {
  if (!resumo) return <SummaryCard to={to} title="Orçamento"><Skeleton className="h-10" /></SummaryCard>
  const { moeda, orcamentoCentavos: orcamento, totalGastoCentavos: gasto, acertos } = resumo
  const estourou = orcamento != null && gasto > orcamento
  return (
    <SummaryCard to={to} title="Orçamento">
      {gasto === 0 && orcamento == null ? (
        <p className="text-sm text-slate-600">Lancem as despesas e o app calcula quem deve quanto.</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            <strong className="font-semibold text-slate-900 tabular-nums">{formatMoney(gasto, moeda)}</strong>
            {orcamento != null ? ` de ${formatMoney(orcamento, moeda)}` : ' gastos'}
          </p>
          {orcamento != null && (
            <ProgressBar
              value={(gasto / orcamento) * 100}
              label="Uso do orçamento"
              barClassName={estourou ? 'bg-red-500' : undefined}
            />
          )}
          {acertos.length > 0 && (
            <p className="text-xs text-slate-500">
              {acertos[0].de.nome.split(' ')[0]} deve {formatMoney(acertos[0].valorCentavos, moeda)} para{' '}
              {acertos[0].para.nome.split(' ')[0]}
            </p>
          )}
        </>
      )}
    </SummaryCard>
  )
}

function ChecklistCard({ to, itens }: { to: string; itens: ChecklistItem[] | undefined }) {
  const feitos = itens?.filter((i) => i.feito).length ?? 0
  const total = itens?.length ?? 0
  return (
    <SummaryCard to={to} title="Checklist">
      {total === 0 ? (
        <p className="text-sm text-slate-600">Mala e tarefas antes de embarcar, com quem cuida de cada uma.</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            <strong className="font-semibold text-slate-900 tabular-nums">
              {feitos} de {total}
            </strong>{' '}
            {feitos === total ? 'itens prontos. Tudo certo.' : 'itens prontos'}
          </p>
          <ProgressBar value={(feitos / total) * 100} label="Itens prontos" />
        </>
      )}
    </SummaryCard>
  )
}

/** Durante a viagem: o que está planejado para hoje, logo no topo. */
function Today({ base, atividades }: { base: string; atividades: Activity[] }) {
  const hoje = todayIso()
  const deHoje = atividades.filter((a) => a.data === hoje).sort((a, b) => a.ordem - b.ordem || a.id - b.id)
  return (
    <section className="rounded-xl bg-white p-4 shadow-card ring-1 ring-slate-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold italic">Hoje</h2>
        <Link to={`${base}/roteiro`} className="text-sm font-medium text-primary hover:underline">
          Ver roteiro
        </Link>
      </div>
      {deHoje.length === 0 ? (
        <p className="text-sm text-slate-600">Nada marcado para hoje. Dia livre.</p>
      ) : (
        <ol className="divide-y divide-slate-100">
          {deHoje.map((a) => (
            <li key={a.id} className="flex items-baseline gap-3 py-2 text-sm">
              <span className="w-12 shrink-0 font-mono font-bold text-tomato-ink">{formatTime(a.horaInicio) ?? '—'}</span>
              <span className="min-w-0">
                <span className="font-medium">{a.titulo}</span>
                {a.localNome && <span className="block truncate text-slate-500">{a.localNome}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando" className="-mx-4 -mt-6 space-y-6 sm:mx-0 sm:mt-0">
      <Skeleton className="h-48 rounded-none sm:h-64 sm:rounded-xl" />
      <div className="space-y-3 px-4 sm:px-0">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-3 px-4 sm:grid-cols-2 sm:px-0">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  )
}
