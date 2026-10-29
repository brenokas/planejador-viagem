import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { formatDay } from '@/features/itinerary/days'
import type { Trip } from '@/features/trips/api'
import { cn } from '@/lib/utils'
import { useDaySuggestions, useGenerateItinerary, type Ritmo } from './api'
import { AiLoading, SuggestionPicker } from './SuggestionPicker'

const RITMOS: { valor: Ritmo; label: string; descricao: string }[] = [
  { valor: 'TRANQUILO', label: 'Tranquilo', descricao: '2 a 3 por dia' },
  { valor: 'EQUILIBRADO', label: 'Equilibrado', descricao: '3 a 4 por dia' },
  { valor: 'INTENSO', label: 'Intenso', descricao: '5 ou mais' },
]

const INTERESSES = ['Gastronomia', 'História', 'Museus', 'Natureza', 'Praia', 'Vida noturna', 'Compras', 'Arte', 'Mirantes']

export function AiItineraryDialog({ trip, open, onClose }: { trip: Trip; open: boolean; onClose: () => void }) {
  const gerar = useGenerateItinerary(trip.id)
  const [ritmo, setRitmo] = useState<Ritmo>('EQUILIBRADO')
  const [interesses, setInteresses] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState('')

  const fechar = () => {
    gerar.reset()
    onClose()
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    gerar.mutate({ ritmo, interesses, observacoes })
  }

  return (
    <Dialog open={open} onClose={fechar} title="Montar roteiro com IA">
      {gerar.isPending ? (
        <AiLoading texto="Montando o roteiro. Leva alguns segundos." />
      ) : gerar.data ? (
        <SuggestionPicker
          tripId={trip.id}
          moeda={trip.moeda}
          sugestoes={gerar.data.atividades}
          aviso={gerar.data.aviso}
          onDone={fechar}
          onRetry={() => gerar.reset()}
        />
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <p className="text-sm text-slate-600">
            A IA sugere atividades para {trip.destino} considerando o que já está no roteiro. Você escolhe o que entra.
          </p>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Ritmo</legend>
            <div className="grid grid-cols-3 gap-2">
              {RITMOS.map((r) => (
                <button
                  key={r.valor}
                  type="button"
                  aria-pressed={ritmo === r.valor}
                  onClick={() => setRitmo(r.valor)}
                  className={cn(
                    'rounded-lg px-2 py-2 text-center ring-1',
                    ritmo === r.valor ? 'bg-primary/5 ring-primary' : 'bg-white ring-slate-200 hover:bg-slate-50',
                  )}
                >
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-xs text-slate-500">{r.descricao}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Interesses</legend>
            <div className="flex flex-wrap gap-2">
              {INTERESSES.map((i) => {
                const ativo = interesses.includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => setInteresses(ativo ? interesses.filter((x) => x !== i) : [...interesses, i])}
                    className={cn(
                      'h-8 rounded-full px-3 text-sm ring-1',
                      ativo ? 'bg-primary text-white ring-primary' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50',
                    )}
                  >
                    {i}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Field label="Algo mais? (opcional)" htmlFor="observacoes">
            <Textarea
              id="observacoes"
              maxLength={500}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: chegamos às 14h no primeiro dia; evitar subidas longas; um jantar especial"
            />
          </Field>

          {gerar.error && <p className="text-sm text-red-600">{gerar.error.message}</p>}
          <Button type="submit" className="w-full">
            Gerar sugestões
          </Button>
        </form>
      )}
    </Dialog>
  )
}

/** data nula = sugestões para Ideias. undefined = fechado. */
export function AiDayDialog({ trip, data, onClose }: { trip: Trip; data: string | null | undefined; onClose: () => void }) {
  const sugerir = useDaySuggestions(trip.id)
  const [pedido, setPedido] = useState('')

  const fechar = () => {
    sugerir.reset()
    setPedido('')
    onClose()
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    sugerir.mutate({ data: data ?? null, pedido })
  }

  const titulo = data ? `Sugestões para ${formatDay(data)}` : 'Sugestões de ideias'

  return (
    <Dialog open={data !== undefined} onClose={fechar} title={titulo}>
      {sugerir.isPending ? (
        <AiLoading texto="Pensando em opções…" />
      ) : sugerir.data ? (
        <SuggestionPicker
          tripId={trip.id}
          moeda={trip.moeda}
          sugestoes={sugerir.data.atividades}
          onDone={fechar}
          onRetry={() => sugerir.reset()}
        />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="O que vocês procuram? (opcional)" htmlFor="pedido">
            <Input
              id="pedido"
              maxLength={300}
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              placeholder="Ex.: algo à noite com música ao vivo"
            />
          </Field>
          {sugerir.error && <p className="text-sm text-red-600">{sugerir.error.message}</p>}
          <Button type="submit" className="w-full">
            Sugerir
          </Button>
        </form>
      )}
    </Dialog>
  )
}
