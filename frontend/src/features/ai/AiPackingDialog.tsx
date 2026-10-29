import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useAddMany } from '@/features/checklist/api'
import { cn } from '@/lib/utils'
import { usePackingSuggestions, type PackingResponse } from './api'
import { AiLoading } from './SuggestionPicker'

export function AiPackingDialog({ tripId, open, onClose }: { tripId: number; open: boolean; onClose: () => void }) {
  const sugerir = usePackingSuggestions(tripId)

  const fechar = () => {
    sugerir.reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={fechar} title="Sugestões para o checklist">
      {sugerir.isPending ? (
        <AiLoading texto="Pensando no clima e nas atividades da viagem…" />
      ) : sugerir.data ? (
        <PackingPicker key={JSON.stringify(sugerir.data)} tripId={tripId} sugestoes={sugerir.data} onDone={fechar} onRetry={() => sugerir.mutate()} />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            A IA sugere o que levar e o que resolver antes de viajar, com base no destino, na época do ano e no roteiro.
            Itens que já estão na lista não se repetem.
          </p>
          {sugerir.error && <p className="text-sm text-red-600">{sugerir.error.message}</p>}
          <Button className="w-full" onClick={() => sugerir.mutate()}>
            Gerar sugestões
          </Button>
        </div>
      )}
    </Dialog>
  )
}

function PackingPicker({
  tripId,
  sugestoes,
  onDone,
  onRetry,
}: {
  tripId: number
  sugestoes: PackingResponse
  onDone: () => void
  onRetry: () => void
}) {
  const addMany = useAddMany(tripId)
  const [bagagem, setBagagem] = useState(() => new Set(sugestoes.bagagem))
  const [tarefas, setTarefas] = useState(() => new Set(sugestoes.tarefas))
  const total = bagagem.size + tarefas.size

  const adicionar = async () => {
    if (bagagem.size) await addMany.mutateAsync({ tipo: 'BAGAGEM', textos: [...bagagem] })
    if (tarefas.size) await addMany.mutateAsync({ tipo: 'TAREFA', textos: [...tarefas] })
    onDone()
  }

  if (sugestoes.bagagem.length + sugestoes.tarefas.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Nada novo para sugerir. A lista de vocês já cobre o essencial.</p>
        <Button variant="outline" className="w-full" onClick={onDone}>
          Fechar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[55dvh] space-y-5 overflow-y-auto pr-1">
        <Grupo titulo="Bagagem" itens={sugestoes.bagagem} marcados={bagagem} onChange={setBagagem} />
        <Grupo titulo="Tarefas" itens={sugestoes.tarefas} marcados={tarefas} onChange={setTarefas} />
      </div>
      {addMany.error && <p className="text-sm text-red-600">{addMany.error.message}</p>}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry} disabled={addMany.isPending}>
          Gerar outras
        </Button>
        <Button className="flex-1" onClick={adicionar} disabled={total === 0 || addMany.isPending}>
          {addMany.isPending ? 'Adicionando…' : `Adicionar ${total} ${total === 1 ? 'item' : 'itens'}`}
        </Button>
      </div>
    </div>
  )
}

function Grupo({
  titulo,
  itens,
  marcados,
  onChange,
}: {
  titulo: string
  itens: string[]
  marcados: Set<string>
  onChange: (s: Set<string>) => void
}) {
  if (itens.length === 0) return null
  const alternar = (item: string) => {
    const novo = new Set(marcados)
    if (novo.has(item)) novo.delete(item)
    else novo.add(item)
    onChange(novo)
  }
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">{titulo}</h3>
        <button
          type="button"
          className="text-xs font-medium text-primary hover:underline"
          onClick={() => onChange(marcados.size === itens.length ? new Set() : new Set(itens))}
        >
          {marcados.size === itens.length ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
      </div>
      <ul className="divide-y divide-slate-100 rounded-xl bg-white ring-1 ring-slate-200">
        {itens.map((item) => {
          const ativo = marcados.has(item)
          return (
            <li key={item}>
              <button
                type="button"
                role="checkbox"
                aria-checked={ativo}
                onClick={() => alternar(item)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm"
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded border-2',
                    ativo ? 'border-primary bg-primary text-white' : 'border-slate-300',
                  )}
                >
                  {ativo && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className={cn(!ativo && 'text-slate-400')}>{item}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
