import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Map as MapIcon, Plus, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Activity } from './api'
import { ActivityCard } from './ActivityCard'
import { mapNumbers } from './days'

export function DaySection({
  id,
  titulo,
  subtitulo,
  atividades,
  moeda,
  vazio,
  hoje,
  onAdd,
  onEdit,
  onReorder,
  onShowMap,
  onSuggest,
}: {
  id: string
  titulo: ReactNode
  subtitulo?: string
  atividades: Activity[]
  moeda: string
  vazio?: string
  hoje?: boolean
  onAdd?: () => void
  onEdit: (a: Activity) => void
  onReorder?: (ids: number[]) => void
  onShowMap?: () => void
  onSuggest?: () => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const numeros = mapNumbers(atividades)
  const total = atividades.reduce((s, a) => s + (a.custoCentavos ?? 0), 0)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !onReorder) return
    const ids = atividades.map((a) => a.id)
    onReorder(arrayMove(ids, ids.indexOf(Number(active.id)), ids.indexOf(Number(over.id))))
  }

  // Dia sem nada: uma linha só, com as ações à mão, para a lista de dias não ficar longa demais.
  if (atividades.length === 0 && !vazio) {
    return (
      <section
        id={id}
        className="flex scroll-mt-32 items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 py-2 pr-1.5 pl-3 md:scroll-mt-44"
      >
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            {titulo}
            {hoje && <span className="rounded-full bg-primary px-2 py-0.5 font-sans text-xs font-medium text-white">Hoje</span>}
          </h2>
          {subtitulo && <p className="truncate text-sm text-slate-500 first-letter:uppercase">{subtitulo}</p>}
        </div>
        <div className="flex shrink-0 items-center">
          {onSuggest && (
            <IconAction label="Sugerir com IA" onClick={onSuggest}>
              <Sparkles className="size-4" />
            </IconAction>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <Plus className="size-4" /> Adicionar
            </button>
          )}
        </div>
      </section>
    )
  }

  return (
    <section id={id} className="scroll-mt-32 md:scroll-mt-44">
      <header className="mb-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            {titulo}
            {hoje && <span className="rounded-full bg-primary px-2 py-0.5 font-sans text-xs font-medium text-white">Hoje</span>}
          </h2>
          {subtitulo && <p className="text-sm text-slate-500 first-letter:uppercase">{subtitulo}</p>}
        </div>
        {atividades.length > 0 && (
          <div className="flex items-center gap-0.5 text-sm">
            {total > 0 && <span className="mr-1 text-slate-500 tabular-nums">{formatMoney(total, moeda)}</span>}
            {onShowMap && numeros.size > 0 && (
              <IconAction label="Ver no mapa" onClick={onShowMap}>
                <MapIcon className="size-4" />
              </IconAction>
            )}
            {onSuggest && (
              <IconAction label="Sugerir mais com IA" onClick={onSuggest}>
                <Sparkles className="size-4" />
              </IconAction>
            )}
            {onAdd && (
              <IconAction label="Adicionar atividade" onClick={onAdd} className="text-primary hover:bg-primary/10">
                <Plus className="size-5" />
              </IconAction>
            )}
          </div>
        )}
      </header>

      {atividades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2.5">
          {vazio && <p className="mb-2 px-1 text-sm text-pretty text-slate-500">{vazio}</p>}
          <div className="flex flex-wrap gap-1">
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-primary hover:bg-primary/10"
              >
                <Plus className="size-4" /> Adicionar
              </button>
            )}
            {onSuggest && (
              <button
                onClick={onSuggest}
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <Sparkles className="size-4" /> Sugerir com IA
              </button>
            )}
          </div>
        </div>
      ) : onReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={atividades.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {atividades.map((a) => (
                <SortableItem key={a.id} activity={a} numero={numeros.get(a.id)} moeda={moeda} onEdit={onEdit} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-2">
          {atividades.map((a) => (
            <li key={a.id}>
              <ActivityCard activity={a} moeda={moeda} onClick={() => onEdit(a)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SortableItem({
  activity,
  numero,
  moeda,
  onEdit,
}: {
  activity: Activity
  numero?: number
  moeda: string
  onEdit: (a: Activity) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10' : undefined}
    >
      <ActivityCard
        activity={activity}
        numero={numero}
        moeda={moeda}
        dragging={isDragging}
        onClick={() => onEdit(activity)}
        handleProps={{ ...attributes, ...listeners }}
      />
    </li>
  )
}

function IconAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn('flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary', className)}
    >
      {children}
    </button>
  )
}
