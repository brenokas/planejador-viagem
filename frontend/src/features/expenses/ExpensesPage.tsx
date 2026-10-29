import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Fab } from '@/components/ui/fab'
import { ProgressBar } from '@/components/ui/progress'
import { PageSkeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/use-confirm'
import { useTrip, type Trip } from '@/features/trips/api'
import { formatMoney, parseDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDeleteExpense, useExpenses, useExpenseSummary, useSettle, type Expense, type Summary } from './api'
import { CATEGORIAS_DESPESA } from './categories'
import { ExpenseDialog, type ExpenseDialogState } from './ExpenseDialog'

export function ExpensesPage() {
  const tripId = Number(useParams().id)
  const trip = useTrip(tripId)
  const expenses = useExpenses(tripId)
  const summary = useExpenseSummary(tripId)
  const [dialog, setDialog] = useState<ExpenseDialogState>(null)

  const erro = trip.error ?? expenses.error ?? summary.error
  if (erro) return <p className="text-red-600">{erro.message}</p>
  if (!trip.data || !expenses.data || !summary.data) return <PageSkeleton />

  const lancadas = expenses.data.filter((e) => e.categoria !== 'ACERTO').length

  return (
    <div>
      <PageHeader
        title="Orçamento"
        description={lancadas === 0 ? 'Nenhuma despesa ainda' : `${lancadas} ${lancadas === 1 ? 'despesa lançada' : 'despesas lançadas'}`}
        actions={
          <Button className="hidden h-10 sm:inline-flex" onClick={() => setDialog({})}>
            <Plus className="size-4" />
            Despesa
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_auto_auto_1fr] lg:gap-6">
        <div className="lg:col-start-1">
          <BudgetOverview summary={summary.data} />
        </div>
        <div className="empty:hidden lg:col-start-1">
          <Balances tripId={tripId} summary={summary.data} temDespesas={expenses.data.length > 0} />
        </div>
        <div className="mt-2 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mt-0">
          <ExpenseList trip={trip.data} expenses={expenses.data} onEdit={(e) => setDialog({ expense: e })} onAdd={() => setDialog({})} />
        </div>
        {summary.data.porCategoria.length > 0 && (
          <div className="lg:col-start-1">
            <ByCategory summary={summary.data} />
          </div>
        )}
      </div>

      <Fab aria-label="Adicionar despesa" onClick={() => setDialog({})}>
        <Plus className="size-6" />
      </Fab>

      <ExpenseDialog trip={trip.data} state={dialog} onClose={() => setDialog(null)} />
    </div>
  )
}

function BudgetOverview({ summary }: { summary: Summary }) {
  const { moeda, orcamentoCentavos: orcamento, totalGastoCentavos: gasto, previstoRoteiroCentavos: previsto } = summary
  const pct = orcamento ? Math.min(100, Math.round((gasto / orcamento) * 100)) : 0
  const estourou = orcamento != null && gasto > orcamento

  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">Gasto até agora</p>
      <p className="mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums">{formatMoney(gasto, moeda)}</p>

      {orcamento != null ? (
        <div className="mt-4 space-y-2">
          <ProgressBar
            value={pct}
            label="Uso do orçamento"
            className="h-2"
            barClassName={estourou ? 'bg-red-500' : undefined}
          />
          <p className={cn('text-sm', estourou ? 'text-red-600' : 'text-slate-600')}>
            {estourou
              ? `${formatMoney(gasto - orcamento, moeda)} acima do orçamento de ${formatMoney(orcamento, moeda)}`
              : `Restam ${formatMoney(orcamento - gasto, moeda)} de ${formatMoney(orcamento, moeda)}`}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Sem orçamento definido. Dá para definir em “Editar viagem”.</p>
      )}

      {previsto > 0 && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
          Custos previstos no roteiro: <span className="font-medium tabular-nums">{formatMoney(previsto, moeda)}</span>
        </p>
      )}
    </section>
  )
}

function Balances({ tripId, summary, temDespesas }: { tripId: number; summary: Summary; temDespesas: boolean }) {
  const settle = useSettle(tripId)
  const confirm = useConfirm()
  const { moeda, pessoas, acertos } = summary
  if (pessoas.length < 2 || !temDespesas) return null

  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="font-semibold">Acertos</h2>

      {acertos.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">Contas em dia. Ninguém deve nada a ninguém.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {acertos.map((a) => (
            <li key={`${a.de.id}-${a.para.id}`} className="flex items-center gap-3">
              <p className="min-w-0 flex-1 text-sm">
                <strong>{a.de.nome.split(' ')[0]}</strong> deve{' '}
                <strong className="tabular-nums">{formatMoney(a.valorCentavos, moeda)}</strong> para{' '}
                <strong>{a.para.nome.split(' ')[0]}</strong>
              </p>
              <Button
                variant="outline"
                className="h-9 shrink-0 px-3"
                disabled={settle.isPending}
                onClick={async () => {
                  const ok = await confirm({
                    titulo: 'Registrar pagamento?',
                    mensagem: `${a.de.nome.split(' ')[0]} pagou ${formatMoney(a.valorCentavos, moeda)} para ${a.para.nome.split(' ')[0]}. Isso entra na lista como um acerto entre vocês.`,
                    confirmar: 'Registrar',
                  })
                  if (ok) settle.mutate({ de: a.de.id, para: a.para.id, valorCentavos: a.valorCentavos })
                }}
              >
                Marcar como pago
              </Button>
            </li>
          ))}
        </ul>
      )}
      {settle.error && <p className="mt-2 text-sm text-red-600">{settle.error.message}</p>}

      <table className="mt-4 w-full border-t border-slate-100 text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="pt-3 font-normal">Pessoa</th>
            <th className="pt-3 text-right font-normal">Pagou</th>
            <th className="pt-3 text-right font-normal">Consumiu</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {pessoas.map((p) => (
            <tr key={p.id}>
              <td className="pt-2">{p.nome.split(' ')[0]}</td>
              <td className="pt-2 text-right">{formatMoney(p.pagouCentavos, moeda)}</td>
              <td className="pt-2 text-right">{formatMoney(p.consumoCentavos, moeda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function ByCategory({ summary }: { summary: Summary }) {
  const maior = summary.porCategoria[0]?.totalCentavos ?? 1
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="mb-3 font-semibold">Por categoria</h2>
      <ul className="space-y-3">
        {summary.porCategoria.map((c) => {
          const cat = CATEGORIAS_DESPESA[c.categoria]
          const pct = summary.totalGastoCentavos ? Math.round((c.totalCentavos / summary.totalGastoCentavos) * 100) : 0
          return (
            <li key={c.categoria}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{cat.label}</span>
                <span className="tabular-nums text-slate-600">
                  {formatMoney(c.totalCentavos, summary.moeda)} <span className="text-slate-400">· {pct}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100">
                <div className={cn('h-full rounded-full', cat.barra)} style={{ width: `${(c.totalCentavos / maior) * 100}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ExpenseList({
  trip,
  expenses,
  onEdit,
  onAdd,
}: {
  trip: Trip
  expenses: Expense[]
  onEdit: (e: Expense) => void
  onAdd: () => void
}) {
  const remove = useDeleteExpense(trip.id)
  const confirm = useConfirm()

  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
        <p className="font-medium">Nenhuma despesa lançada</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-pretty text-slate-500">
          Registrem o que cada um pagou. O app divide e mostra quem deve quanto.
        </p>
        <Button variant="outline" className="mt-4" onClick={onAdd}>
          <Plus className="size-4" /> Lançar despesa
        </Button>
      </div>
    )
  }

  const porData = new Map<string, Expense[]>()
  for (const e of expenses) porData.set(e.data, [...(porData.get(e.data) ?? []), e])
  const formatDia = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

  const handleClick = async (e: Expense) => {
    if (e.categoria !== 'ACERTO') return onEdit(e)
    const ok = await confirm({ titulo: 'Desfazer acerto?', mensagem: e.descricao, confirmar: 'Desfazer', perigo: true })
    if (ok) remove.mutate(e.id)
  }

  return (
    <section className="space-y-5">
      {[...porData.entries()].map(([data, lista]) => (
        <div key={data}>
          <h3 className="mb-2 flex justify-between gap-2 px-1 text-sm font-medium text-slate-500">
            <span className="first-letter:uppercase">{formatDia.format(parseDate(data))}</span>
            <span className="tabular-nums">
              {formatMoney(
                lista.filter((e) => e.categoria !== 'ACERTO').reduce((s, e) => s + e.valorConvertidoCentavos, 0),
                trip.moeda,
              )}
            </span>
          </h3>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            {lista.map((e) => (
              <li key={e.id}>
                <ExpenseRow expense={e} moedaViagem={trip.moeda} onClick={() => handleClick(e)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {remove.error && <p className="text-sm text-red-600">{remove.error.message}</p>}
    </section>
  )
}

function ExpenseRow({ expense: e, moedaViagem, onClick }: { expense: Expense; moedaViagem: string; onClick: () => void }) {
  const cat = CATEGORIAS_DESPESA[e.categoria]
  const Icon = cat.icon
  const acerto = e.categoria === 'ACERTO'

  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', cat.classe)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', acerto && 'text-slate-500')}>{e.descricao}</p>
        <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
          <Avatar id={e.pagoPor.id} nome={e.pagoPor.nome} className="size-4 text-[8px] ring-0" />
          {acerto ? 'Pagamento entre vocês' : `${e.pagoPor.nome.split(' ')[0]} pagou · ${descreverDivisao(e)}`}
        </p>
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <p className={cn('font-medium', acerto && 'text-slate-500')}>{formatMoney(e.valorConvertidoCentavos, moedaViagem)}</p>
        {e.moeda !== moedaViagem && <p className="text-xs text-slate-500">{formatMoney(e.valorCentavos, e.moeda)}</p>}
      </div>
    </button>
  )
}

function descreverDivisao(e: Expense) {
  if (e.divisao.length === 1) {
    return e.divisao[0].userId === e.pagoPor.id ? 'só para si' : `para ${e.divisao[0].nome.split(' ')[0]}`
  }
  return e.modoDivisao === 'IGUAL' ? 'dividido igualmente' : 'dividido por valor'
}
