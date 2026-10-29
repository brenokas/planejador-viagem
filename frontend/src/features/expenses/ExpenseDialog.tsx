import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useConfirm } from '@/components/ui/use-confirm'
import type { Trip } from '@/features/trips/api'
import { ApiError } from '@/lib/api'
import { centsToInput, formatMoney, MOEDAS, parseDecimal, parseMoney, todayIso } from '@/lib/format'
import { applyServerErrors } from '@/lib/form'
import { cn } from '@/lib/utils'
import { useDeleteExpense, useRate, useSaveExpense, type Expense, type ExpenseCategory, type SplitMode } from './api'
import { CATEGORIAS_DESPESA, CATEGORIAS_LANCAVEIS } from './categories'

const valorValido = (v: string) => !Number.isNaN(parseMoney(v))

const schema = z
  .object({
    descricao: z.string().trim().min(1, 'Informe uma descrição.').max(150, 'Descrição muito longa.'),
    valor: z.string().refine((v) => (parseMoney(v) ?? 0) > 0, 'Informe um valor maior que zero.'),
    moeda: z.string().length(3),
    taxa: z.string(),
    data: z.string().min(1, 'Informe a data.'),
    categoria: z.string(),
    pagoPor: z.string().min(1, 'Escolha quem pagou.'),
    modoDivisao: z.enum(['IGUAL', 'VALORES']),
    participantes: z.array(z.string()),
    valores: z.record(z.string(), z.string()),
  })
  .superRefine((d, ctx) => {
    if (d.modoDivisao === 'IGUAL' && d.participantes.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['participantes'], message: 'Escolha quem participa da divisão.' })
    }
    if (d.modoDivisao === 'VALORES') {
      const partes = Object.values(d.valores)
      if (partes.some((v) => !valorValido(v))) {
        ctx.addIssue({ code: 'custom', path: ['valores'], message: 'Há um valor inválido.' })
      } else if (partes.reduce((s, v) => s + (parseMoney(v) ?? 0), 0) !== parseMoney(d.valor)) {
        ctx.addIssue({ code: 'custom', path: ['valores'], message: 'A soma das partes deve ser igual ao valor total.' })
      }
    }
  })

type FormData = z.infer<typeof schema>

export type ExpenseDialogState = { expense?: Expense } | null

export function ExpenseDialog({
  trip,
  state,
  onClose,
}: {
  trip: Trip
  state: ExpenseDialogState
  onClose: () => void
}) {
  return (
    <Dialog open={state != null} onClose={onClose} title={state?.expense ? 'Editar despesa' : 'Nova despesa'}>
      {state && (
        <ExpenseForm
          key={state.expense ? `${state.expense.id}-${state.expense.version}` : 'nova'}
          trip={trip}
          expense={state.expense}
          onDone={onClose}
        />
      )}
    </Dialog>
  )
}

function ExpenseForm({ trip, expense, onDone }: { trip: Trip; expense?: Expense; onDone: () => void }) {
  const save = useSaveExpense(trip.id)
  const remove = useDeleteExpense(trip.id)
  const confirm = useConfirm()

  // Quem já saiu da viagem continua aparecendo nas despesas antigas em que participou.
  const pessoas = [...trip.membros.map((m) => ({ id: m.id, nome: m.nome }))]
  for (const p of [expense?.pagoPor, ...(expense?.divisao.map((s) => ({ id: s.userId, nome: s.nome })) ?? [])]) {
    if (p && !pessoas.some((x) => x.id === p.id)) pessoas.push(p)
  }

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao: expense?.descricao ?? '',
      valor: centsToInput(expense?.valorCentavos ?? null),
      moeda: expense?.moeda ?? trip.moeda,
      taxa: expense && expense.moeda !== trip.moeda ? formatTaxa(expense.taxaCambio) : '',
      data: expense?.data ?? todayIso(),
      categoria: expense?.categoria ?? 'ALIMENTACAO',
      pagoPor: String(expense?.pagoPor.id ?? trip.membros.find((m) => m.papel === 'DONO')?.id ?? ''),
      modoDivisao: expense?.modoDivisao ?? 'IGUAL',
      participantes: expense ? expense.divisao.map((s) => String(s.userId)) : trip.membros.map((m) => String(m.id)),
      valores: Object.fromEntries(
        pessoas.map((p) => [
          String(p.id),
          centsToInput(expense?.divisao.find((s) => s.userId === p.id)?.valorCentavos ?? null),
        ]),
      ),
    },
  })

  const [moeda, valor, taxa, modo, valores] = useWatch({
    control,
    name: ['moeda', 'valor', 'taxa', 'modoDivisao', 'valores'],
  })
  const estrangeira = moeda !== trip.moeda
  const rate = useRate(moeda, trip.moeda)
  const [taxaEditada, setTaxaEditada] = useState(Boolean(expense && estrangeira))

  useEffect(() => {
    if (estrangeira && !taxaEditada && rate.data) setValue('taxa', formatTaxa(rate.data.taxa))
  }, [estrangeira, taxaEditada, rate.data, setValue])

  const valorCentavos = parseMoney(valor)
  const taxaNumero = estrangeira ? parseDecimal(taxa) : 1
  const convertido =
    valorCentavos && taxaNumero && !Number.isNaN(valorCentavos) && !Number.isNaN(taxaNumero)
      ? Math.round(valorCentavos * taxaNumero)
      : null
  const somaPartes = Object.values(valores ?? {}).reduce((s, v) => s + (parseMoney(v) || 0), 0)

  const submit = handleSubmit((d) => {
    const taxaCambio = estrangeira ? parseDecimal(d.taxa) : null
    if (estrangeira && (taxaCambio == null || Number.isNaN(taxaCambio) || taxaCambio <= 0)) {
      setError('taxa', { message: 'Informe a taxa de câmbio.' })
      return
    }
    save.mutate(
      {
        id: expense?.id,
        input: {
          descricao: d.descricao,
          categoria: d.categoria as ExpenseCategory,
          valorCentavos: parseMoney(d.valor)!,
          moeda: d.moeda,
          taxaCambio,
          data: d.data,
          pagoPor: Number(d.pagoPor),
          modoDivisao: d.modoDivisao as SplitMode,
          participantes: d.modoDivisao === 'IGUAL' ? d.participantes.map(Number) : undefined,
          valores:
            d.modoDivisao === 'VALORES'
              ? Object.fromEntries(Object.entries(d.valores).map(([id, v]) => [id, parseMoney(v) ?? 0]))
              : undefined,
          version: expense?.version,
        },
      },
      { onSuccess: onDone, onError: (e) => applyServerErrors(e, setError) },
    )
  })

  const erroDivisao = errors.participantes?.message ?? (errors.valores?.message as string | undefined)

  const handleDelete = async () => {
    if (!expense) return
    if (!(await confirm({ titulo: 'Excluir despesa?', mensagem: expense.descricao, confirmar: 'Excluir', perigo: true }))) return
    remove.mutate(expense.id, { onSuccess: onDone })
  }

  const erroGeral = save.error && !(save.error instanceof ApiError && Object.keys(save.error.campos).length > 0)

  return (
    <form onSubmit={submit} className="max-h-[70dvh] space-y-4 overflow-y-auto px-0.5 pb-1" noValidate>
      <Field label="Descrição" htmlFor="descricao" error={errors.descricao?.message}>
        <Input
          id="descricao"
          placeholder="Ex.: Jantar em Trastevere"
          aria-invalid={!!errors.descricao}
          {...register('descricao')}
        />
      </Field>

      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Field label="Valor" htmlFor="valor" error={errors.valor?.message}>
          <Input
            id="valor"
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={!!errors.valor}
            {...register('valor')}
          />
        </Field>
        <Field label="Moeda" htmlFor="moeda">
          <Select
            id="moeda"
            {...register('moeda', {
              onChange: () => {
                setTaxaEditada(false)
                setValue('taxa', '')
              },
            })}
          >
            {MOEDAS.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {estrangeira && (
        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
          <Field label={`Câmbio: 1 ${moeda} vale quantos ${trip.moeda}?`} htmlFor="taxa" error={errors.taxa?.message}>
            <Input
              id="taxa"
              inputMode="decimal"
              placeholder={rate.isFetching ? 'Buscando cotação…' : '0,00'}
              aria-invalid={!!errors.taxa}
              {...register('taxa', { onChange: () => setTaxaEditada(true) })}
            />
          </Field>
          <p className="text-xs text-slate-500">
            {rate.error
              ? 'Não foi possível buscar a cotação. Informe a taxa que você pagou.'
              : rate.data && !taxaEditada
                ? `Cotação do dia (${new Date(rate.data.atualizadoEm).toLocaleDateString('pt-BR')}). Ajuste se o cartão cobrou outro valor.`
                : 'Taxa informada manualmente.'}
          </p>
          {convertido != null && <p className="text-sm font-medium">≈ {formatMoney(convertido, trip.moeda)}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data" htmlFor="data" error={errors.data?.message}>
          <Input id="data" type="date" {...register('data')} />
        </Field>
        <Field label="Categoria" htmlFor="categoria">
          <Select id="categoria" {...register('categoria')}>
            {CATEGORIAS_LANCAVEIS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIAS_DESPESA[c].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-slate-700">Quem pagou</legend>
        <Controller
          control={control}
          name="pagoPor"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {pessoas.map((p) => (
                <Toggle key={p.id} ativo={field.value === String(p.id)} onClick={() => field.onChange(String(p.id))}>
                  {p.nome.split(' ')[0]}
                </Toggle>
              ))}
            </div>
          )}
        />
        {errors.pagoPor && <p className="text-sm text-red-600">{errors.pagoPor.message}</p>}
      </fieldset>

      <fieldset className="space-y-2">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-medium text-slate-700">Dividir</legend>
          <Controller
            control={control}
            name="modoDivisao"
            render={({ field }) => (
              <div className="inline-flex rounded-lg bg-white p-0.5 ring-1 ring-slate-300 text-xs">
                {(
                  [
                    ['IGUAL', 'Igualmente'],
                    ['VALORES', 'Por valor'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => field.onChange(v)}
                    className={cn(
                      'rounded-md px-2.5 py-1 font-medium text-slate-600',
                      field.value === v && 'bg-slate-800 text-white',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {modo === 'IGUAL' ? (
          <Controller
            control={control}
            name="participantes"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {pessoas.map((p) => {
                  const id = String(p.id)
                  const ativo = field.value.includes(id)
                  return (
                    <Toggle
                      key={p.id}
                      ativo={ativo}
                      onClick={() => field.onChange(ativo ? field.value.filter((x) => x !== id) : [...field.value, id])}
                    >
                      {p.nome.split(' ')[0]}
                    </Toggle>
                  )
                })}
              </div>
            )}
          />
        ) : (
          <div className="space-y-2">
            {pessoas.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_8rem] items-center gap-3">
                <label htmlFor={`valor-${p.id}`} className="text-sm">
                  {p.nome}
                </label>
                <Input
                  id={`valor-${p.id}`}
                  inputMode="decimal"
                  placeholder="0,00"
                  className="h-10"
                  {...register(`valores.${p.id}`)}
                />
              </div>
            ))}
            {valorCentavos != null && !Number.isNaN(valorCentavos) && somaPartes !== valorCentavos && (
              <p className="text-xs text-slate-500">
                {somaPartes < valorCentavos
                  ? `Faltam ${formatMoney(valorCentavos - somaPartes, moeda)}`
                  : `Passou ${formatMoney(somaPartes - valorCentavos, moeda)} do total`}
              </p>
            )}
          </div>
        )}
        {erroDivisao && (
          <p className="text-sm text-red-600">{erroDivisao}</p>
        )}
      </fieldset>

      {erroGeral && <p className="text-sm text-red-600">{save.error.message}</p>}
      {remove.error && <p className="text-sm text-red-600">{remove.error.message}</p>}

      <div className="flex gap-3 pt-2">
        {expense && (
          <Button type="button" variant="outline" className="text-red-600" onClick={handleDelete} aria-label="Excluir">
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={save.isPending}>
          {save.isPending ? 'Salvando…' : expense ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}

function Toggle({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        'h-9 rounded-full px-4 text-sm font-medium ring-1 transition-colors',
        ativo ? 'bg-primary text-white ring-primary' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}

function formatTaxa(taxa: number) {
  return taxa.toLocaleString('pt-BR', { maximumFractionDigits: 6 })
}
