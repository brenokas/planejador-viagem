import { ArrowLeft, Check, ChevronDown, Plus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMe } from '@/features/auth/api'
import { useTrip, type Member } from '@/features/trips/api'
import { parseDate, today } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAddMany, useChecklist, useCreateItem, useToggleItem, type ChecklistItem, type ChecklistType } from './api'
import { ItemDialog } from './ItemDialog'
import { SUGESTOES } from './suggestions'

const ABAS: { tipo: ChecklistType; label: string; placeholder: string }[] = [
  { tipo: 'BAGAGEM', label: 'Bagagem', placeholder: 'Ex.: Carregador portátil' },
  { tipo: 'TAREFA', label: 'Tarefas', placeholder: 'Ex.: Reservar o transfer' },
]

/** "todos" ou o id de um participante */
type Filtro = 'todos' | number

export function ChecklistPage() {
  const tripId = Number(useParams().id)
  const trip = useTrip(tripId)
  const checklist = useChecklist(tripId)
  const { data: me } = useMe()
  const [tipo, setTipo] = useState<ChecklistType>('BAGAGEM')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [editando, setEditando] = useState<ChecklistItem | null>(null)

  const erro = trip.error ?? checklist.error
  if (erro) return <p className="text-red-600">{erro.message}</p>
  if (!trip.data || !checklist.data) return <p className="text-slate-500">Carregando…</p>

  const membros = trip.data.membros
  const daAba = checklist.data.filter((i) => i.tipo === tipo)
  const visiveis = filtro === 'todos' ? daAba : daAba.filter((i) => i.responsavelId === filtro)
  const pendentes = visiveis.filter((i) => !i.feito)
  const feitos = visiveis.filter((i) => i.feito)
  const aba = ABAS.find((a) => a.tipo === tipo)!

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={`/viagens/${tripId}`}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Voltar para a viagem"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">Checklist</h1>
          <p className="truncate text-sm text-slate-500">{trip.data.titulo}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-1 text-sm" role="tablist">
        {ABAS.map((a) => {
          const itens = checklist.data.filter((i) => i.tipo === a.tipo)
          return (
            <button
              key={a.tipo}
              role="tab"
              aria-selected={tipo === a.tipo}
              onClick={() => setTipo(a.tipo)}
              className={cn(
                'rounded-md px-3 py-2 font-medium text-slate-600',
                tipo === a.tipo && 'bg-white text-slate-900 shadow-sm',
              )}
            >
              {a.label}{' '}
              <span className="tabular-nums text-slate-400">
                {itens.filter((i) => i.feito).length}/{itens.length}
              </span>
            </button>
          )
        })}
      </div>

      {membros.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <FiltroChip ativo={filtro === 'todos'} onClick={() => setFiltro('todos')}>
            Todos
          </FiltroChip>
          {membros.map((m) => (
            <FiltroChip key={m.id} ativo={filtro === m.id} onClick={() => setFiltro(m.id)}>
              {m.id === me?.id ? 'Meus' : `De ${m.nome.split(' ')[0]}`}
            </FiltroChip>
          ))}
        </div>
      )}

      <QuickAdd
        key={tipo}
        tripId={tripId}
        tipo={tipo}
        placeholder={aba.placeholder}
        responsavelId={filtro === 'todos' ? null : filtro}
      />

      {daAba.length === 0 ? (
        <EmptyState tripId={tripId} tipo={tipo} />
      ) : (
        <>
          <Progresso feitos={daAba.filter((i) => i.feito).length} total={daAba.length} />
          {pendentes.length === 0 && feitos.length > 0 ? (
            <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-slate-600 ring-1 ring-slate-200">
              Tudo pronto por aqui.
            </p>
          ) : (
            <ItemList tripId={tripId} itens={pendentes} membros={membros} onEdit={setEditando} />
          )}
          {feitos.length > 0 && (
            <details className="group mt-6">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-slate-500">
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                Concluídos ({feitos.length})
              </summary>
              <div className="mt-2">
                <ItemList tripId={tripId} itens={feitos} membros={membros} onEdit={setEditando} />
              </div>
            </details>
          )}
        </>
      )}

      <ItemDialog tripId={tripId} membros={membros} item={editando} onClose={() => setEditando(null)} />
    </div>
  )
}

function QuickAdd({
  tripId,
  tipo,
  placeholder,
  responsavelId,
}: {
  tripId: number
  tipo: ChecklistType
  placeholder: string
  responsavelId: number | null
}) {
  const create = useCreateItem(tripId)
  const [texto, setTexto] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    create.mutate({ tipo, texto: t, responsavelId, prazo: null }, { onSuccess: () => setTexto('') })
  }

  return (
    <form onSubmit={submit} className="mb-4">
      <div className="flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          maxLength={200}
          aria-label="Novo item"
          enterKeyHint="done"
        />
        <Button type="submit" className="shrink-0 px-3" disabled={!texto.trim() || create.isPending} aria-label="Adicionar">
          <Plus className="size-5" />
        </Button>
      </div>
      {create.error && <p className="mt-1 text-sm text-red-600">{create.error.message}</p>}
    </form>
  )
}

function ItemList({
  tripId,
  itens,
  membros,
  onEdit,
}: {
  tripId: number
  itens: ChecklistItem[]
  membros: Member[]
  onEdit: (i: ChecklistItem) => void
}) {
  const toggle = useToggleItem(tripId)
  if (itens.length === 0) return null

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      {itens.map((item) => {
        const responsavel = membros.find((m) => m.id === item.responsavelId)
        return (
          <li key={item.id} className="flex items-center gap-1">
            <button
              type="button"
              role="checkbox"
              aria-checked={item.feito}
              aria-label={item.feito ? `Desmarcar ${item.texto}` : `Marcar ${item.texto}`}
              onClick={() => toggle.mutate({ id: item.id, feito: !item.feito })}
              className="flex size-12 shrink-0 items-center justify-center"
            >
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-md border-2 transition-colors',
                  item.feito ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white',
                )}
              >
                {item.feito && <Check className="size-4" strokeWidth={3} />}
              </span>
            </button>
            <button type="button" onClick={() => onEdit(item)} className="flex min-w-0 flex-1 items-center gap-2 py-3 pr-3 text-left">
              <span className={cn('min-w-0 flex-1', item.feito && 'text-slate-400 line-through')}>{item.texto}</span>
              {item.prazo && !item.feito && <Prazo data={item.prazo} />}
              {responsavel && <Avatar id={responsavel.id} nome={responsavel.nome} className="size-6 text-[10px] ring-0" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Prazo({ data }: { data: string }) {
  const atrasado = parseDate(data) < today()
  return (
    <span
      className={cn(
        'shrink-0 rounded px-1.5 py-0.5 text-xs tabular-nums',
        atrasado ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600',
      )}
    >
      {atrasado ? 'atrasado · ' : 'até '}
      {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(parseDate(data))}
    </span>
  )
}

function Progresso({ feitos, total }: { feitos: number; total: number }) {
  const pct = Math.round((feitos / total) * 100)
  return (
    <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso"
      >
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums">{pct}%</span>
    </div>
  )
}

function EmptyState({ tripId, tipo }: { tripId: number; tipo: ChecklistType }) {
  const addMany = useAddMany(tripId)
  const sugestoes = SUGESTOES[tipo]
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
      <p className="text-sm text-slate-600">
        {tipo === 'BAGAGEM' ? 'Nada na mala ainda.' : 'Nenhuma tarefa antes da viagem.'} Adicione acima ou comece por uma
        lista básica com {sugestoes.length} itens.
      </p>
      <Button
        variant="outline"
        className="mt-4"
        disabled={addMany.isPending}
        onClick={() => addMany.mutate({ tipo, textos: sugestoes })}
      >
        Usar lista básica
      </Button>
      {addMany.error && <p className="mt-2 text-sm text-red-600">{addMany.error.message}</p>}
    </div>
  )
}

function FiltroChip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        'h-8 rounded-full px-3 text-sm font-medium ring-1',
        ativo ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}
