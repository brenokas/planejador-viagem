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
import { Map as MapIcon, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatMoney } from '@/lib/format'
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
  onAdd,
  onEdit,
  onReorder,
  onShowMap,
}: {
  id: string
  titulo: ReactNode
  subtitulo?: string
  atividades: Activity[]
  moeda: string
  vazio: string
  onAdd?: () => void
  onEdit: (a: Activity) => void
  onReorder?: (ids: number[]) => void
  onShowMap?: () => void
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

  return (
    <section id={id} className="scroll-mt-20">
      <header className="mb-2 flex items-end justify-between gap-2">
        <div>
          <h2 className="font-semibold">{titulo}</h2>
          {subtitulo && <p className="text-sm text-slate-500 capitalize">{subtitulo}</p>}
        </div>
        <div className="flex items-center gap-1 text-sm">
          {total > 0 && <span className="mr-1 text-slate-500">{formatMoney(total, moeda)}</span>}
          {onShowMap && numeros.size > 0 && (
            <button
              onClick={onShowMap}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary"
              aria-label="Ver no mapa"
              title="Ver no mapa"
            >
              <MapIcon className="size-4" />
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="rounded-lg p-2 text-primary hover:bg-primary/10"
              aria-label="Adicionar atividade"
              title="Adicionar atividade"
            >
              <Plus className="size-5" />
            </button>
          )}
        </div>
      </header>

      {atividades.length === 0 ? (
        <button
          onClick={onAdd}
          disabled={!onAdd}
          className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 hover:border-primary hover:text-primary"
        >
          {vazio}
        </button>
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
