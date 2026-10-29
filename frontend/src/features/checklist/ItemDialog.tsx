import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useConfirm } from '@/components/ui/use-confirm'
import type { Member } from '@/features/trips/api'
import { useDeleteItem, useUpdateItem, type ChecklistItem, type ChecklistType } from './api'

export function ItemDialog({
  tripId,
  membros,
  item,
  onClose,
}: {
  tripId: number
  membros: Member[]
  item: ChecklistItem | null
  onClose: () => void
}) {
  return (
    <Dialog open={item != null} onClose={onClose} title="Editar item">
      {item && <ItemForm key={`${item.id}-${item.version}`} tripId={tripId} membros={membros} item={item} onDone={onClose} />}
    </Dialog>
  )
}

function ItemForm({
  tripId,
  membros,
  item,
  onDone,
}: {
  tripId: number
  membros: Member[]
  item: ChecklistItem
  onDone: () => void
}) {
  const update = useUpdateItem(tripId)
  const remove = useDeleteItem(tripId)
  const confirm = useConfirm()
  const [texto, setTexto] = useState(item.texto)
  const [tipo, setTipo] = useState<ChecklistType>(item.tipo)
  const [responsavel, setResponsavel] = useState(item.responsavelId ? String(item.responsavelId) : '')
  const [prazo, setPrazo] = useState(item.prazo ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!texto.trim()) return
    update.mutate(
      {
        id: item.id,
        input: {
          tipo,
          texto: texto.trim(),
          responsavelId: responsavel ? Number(responsavel) : null,
          prazo: tipo === 'TAREFA' && prazo ? prazo : null,
          version: item.version,
        },
      },
      { onSuccess: onDone },
    )
  }

  const handleDelete = async () => {
    if (await confirm({ titulo: 'Excluir item?', mensagem: item.texto, confirmar: 'Excluir', perigo: true })) {
      remove.mutate(item.id, { onSuccess: onDone })
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Item" htmlFor="texto" error={!texto.trim() ? 'Escreva o item.' : undefined}>
        <Input id="texto" value={texto} maxLength={200} onChange={(e) => setTexto(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lista" htmlFor="tipo">
          <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as ChecklistType)}>
            <option value="BAGAGEM">Bagagem</option>
            <option value="TAREFA">Tarefas</option>
          </Select>
        </Field>
        <Field label="Responsável" htmlFor="responsavel">
          <Select id="responsavel" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
            <option value="">Ninguém</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {tipo === 'TAREFA' && (
        <Field label="Prazo (opcional)" htmlFor="prazo">
          <Input id="prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </Field>
      )}
      {item.feito && item.feitoPorNome && <p className="text-sm text-slate-500">Marcado como feito por {item.feitoPorNome}.</p>}
      {(update.error || remove.error) && <p className="text-sm text-red-600">{(update.error ?? remove.error)?.message}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="text-red-600" onClick={handleDelete} aria-label="Excluir">
          <Trash2 className="size-4" />
        </Button>
        <Button type="submit" className="flex-1" disabled={update.isPending}>
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
