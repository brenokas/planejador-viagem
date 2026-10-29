import { Check, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CATEGORIAS } from '@/features/itinerary/categories'
import { formatDay, formatTime } from '@/features/itinerary/days'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAcceptSuggestions, type ActivitySuggestion } from './api'

/** Lista de atividades sugeridas com caixas de seleção; só as marcadas vão para o roteiro. */
export function SuggestionPicker({
  tripId,
  moeda,
  sugestoes,
  aviso,
  onDone,
  onRetry,
}: {
  tripId: number
  moeda: string
  sugestoes: ActivitySuggestion[]
  aviso?: string | null
  onDone: () => void
  onRetry: () => void
}) {
  const accept = useAcceptSuggestions(tripId)
  const [marcadas, setMarcadas] = useState(() => new Set(sugestoes.map((_, i) => i)))

  if (sugestoes.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">A IA não trouxe sugestões aproveitáveis desta vez.</p>
        <Button variant="outline" className="w-full" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  const grupos = new Map<string, { s: ActivitySuggestion; i: number }[]>()
  sugestoes.forEach((s, i) => {
    const chave = s.data ?? 'ideias'
    grupos.set(chave, [...(grupos.get(chave) ?? []), { s, i }])
  })

  const alternar = (i: number) =>
    setMarcadas((atual) => {
      const novo = new Set(atual)
      if (novo.has(i)) novo.delete(i)
      else novo.add(i)
      return novo
    })

  const aceitar = () =>
    accept.mutate(
      sugestoes.filter((_, i) => marcadas.has(i)),
      { onSuccess: onDone },
    )

  return (
    <div className="space-y-4">
      {aviso && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{aviso}</p>}
      <div className="max-h-[55dvh] space-y-4 overflow-y-auto pr-1">
        {[...grupos.entries()].map(([chave, itens]) => (
          <section key={chave}>
            <h3 className="mb-1.5 text-sm font-medium text-slate-500 capitalize">
              {chave === 'ideias' ? 'Ideias' : formatDay(chave)}
            </h3>
            <ul className="space-y-1.5">
              {itens.map(({ s, i }) => {
                const ativo = marcadas.has(i)
                const Icon = CATEGORIAS[s.categoria].icon
                return (
                  <li key={i}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={ativo}
                      onClick={() => alternar(i)}
                      className={cn(
                        'flex w-full gap-3 rounded-xl p-3 text-left ring-1 transition-colors',
                        ativo ? 'bg-primary/5 ring-primary/40' : 'bg-white ring-slate-200',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2',
                          ativo ? 'border-primary bg-primary text-white' : 'border-slate-300',
                        )}
                      >
                        {ativo && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Icon className="size-4 shrink-0 text-slate-400" aria-hidden />
                          {formatTime(s.horaInicio) && (
                            <span className="tabular-nums text-slate-500">{formatTime(s.horaInicio)}</span>
                          )}
                          <span className="min-w-0">{s.titulo}</span>
                        </span>
                        {s.localNome && (
                          <span className="flex items-center gap-1 text-sm text-slate-500">
                            <MapPin className="size-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{s.localNome}</span>
                            {s.lat == null && <span className="shrink-0 text-xs text-slate-400">(sem mapa)</span>}
                          </span>
                        )}
                        {s.notas && <span className="block text-sm text-slate-600">{s.notas}</span>}
                        {s.custoCentavos != null && (
                          <span className="block text-xs text-slate-500">
                            ≈ {formatMoney(s.custoCentavos, moeda)} para os dois
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Sugestões da IA podem ter erros de horário, preço ou localização. Confira antes de ir.
      </p>
      {accept.error && <p className="text-sm text-red-600">{accept.error.message}</p>}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry} disabled={accept.isPending}>
          Gerar outras
        </Button>
        <Button className="flex-1" onClick={aceitar} disabled={marcadas.size === 0 || accept.isPending}>
          {accept.isPending
            ? 'Adicionando…'
            : `Adicionar ${marcadas.size} ${marcadas.size === 1 ? 'atividade' : 'atividades'}`}
        </Button>
      </div>
    </div>
  )
}

export function AiLoading({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
      <span className="size-8 rounded-full border-4 border-primary/20 border-t-primary motion-safe:animate-spin" aria-hidden />
      <p className="text-sm text-slate-600">{texto}</p>
    </div>
  )
}
