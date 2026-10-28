import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ApiError } from '@/lib/api'
import { centsToInput, MOEDAS, parseMoney, tripDays } from '@/lib/format'
import { applyServerErrors } from '@/lib/form'
import type { Trip, TripInput } from './api'

const MAX_DIAS = 90

const schema = z
  .object({
    titulo: z.string().trim().min(1, 'Informe um título.').max(120, 'Título muito longo.'),
    destino: z.string().trim().min(1, 'Informe o destino.').max(200, 'Destino muito longo.'),
    dataInicio: z.string().min(1, 'Informe a data de ida.'),
    dataFim: z.string().min(1, 'Informe a data de volta.'),
    moeda: z.string().length(3),
    orcamento: z
      .string()
      .refine((v) => !Number.isNaN(parseMoney(v)), 'Valor inválido.')
      .refine((v) => (parseMoney(v) ?? 0) >= 0, 'O orçamento não pode ser negativo.'),
    capaUrl: z.union([z.literal(''), z.url({ protocol: /^https?$/, message: 'Use um endereço http(s).' })]),
  })
  .refine((d) => !d.dataInicio || !d.dataFim || d.dataFim >= d.dataInicio, {
    path: ['dataFim'],
    message: 'A volta deve ser depois da ida.',
  })
  .refine((d) => !d.dataInicio || !d.dataFim || d.dataFim < d.dataInicio || tripDays(d.dataInicio, d.dataFim) <= MAX_DIAS, {
    path: ['dataFim'],
    message: `A viagem pode ter no máximo ${MAX_DIAS} dias.`,
  })

type FormData = z.infer<typeof schema>

export function TripForm({
  trip,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  trip?: Trip
  submitLabel: string
  pending: boolean
  error: Error | null
  onSubmit: (input: TripInput, handlers: { onError: (e: Error) => void }) => void
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: trip?.titulo ?? '',
      destino: trip?.destino ?? '',
      dataInicio: trip?.dataInicio ?? '',
      dataFim: trip?.dataFim ?? '',
      moeda: trip?.moeda ?? 'BRL',
      orcamento: centsToInput(trip?.orcamentoCentavos ?? null),
      capaUrl: trip?.capaUrl ?? '',
    },
  })

  const dataInicio = useWatch({ control, name: 'dataInicio' })

  const submit = handleSubmit((d) =>
    onSubmit(
      {
        titulo: d.titulo,
        destino: d.destino,
        dataInicio: d.dataInicio,
        dataFim: d.dataFim,
        moeda: d.moeda,
        orcamentoCentavos: parseMoney(d.orcamento),
        capaUrl: d.capaUrl || null,
        version: trip?.version,
      },
      { onError: (e) => applyServerErrors(e, setError) },
    ),
  )

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Título" htmlFor="titulo" error={errors.titulo?.message}>
        <Input id="titulo" placeholder="Ex.: Férias de julho" aria-invalid={!!errors.titulo} {...register('titulo')} />
      </Field>

      <Field label="Destino" htmlFor="destino" error={errors.destino?.message}>
        <Input
          id="destino"
          placeholder="Ex.: Lisboa, Portugal"
          aria-invalid={!!errors.destino}
          {...register('destino')}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ida" htmlFor="dataInicio" error={errors.dataInicio?.message}>
          <Input id="dataInicio" type="date" aria-invalid={!!errors.dataInicio} {...register('dataInicio')} />
        </Field>
        <Field label="Volta" htmlFor="dataFim" error={errors.dataFim?.message}>
          <Input
            id="dataFim"
            type="date"
            min={dataInicio || undefined}
            aria-invalid={!!errors.dataFim}
            {...register('dataFim')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Moeda" htmlFor="moeda" error={errors.moeda?.message}>
          <Select id="moeda" {...register('moeda')}>
            {MOEDAS.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} · {m.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Orçamento (opcional)" htmlFor="orcamento" error={errors.orcamento?.message}>
          <Input
            id="orcamento"
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={!!errors.orcamento}
            {...register('orcamento')}
          />
        </Field>
      </div>

      <Field label="Imagem de capa (opcional)" htmlFor="capaUrl" error={errors.capaUrl?.message}>
        <Input
          id="capaUrl"
          type="url"
          inputMode="url"
          placeholder="https://…"
          aria-invalid={!!errors.capaUrl}
          {...register('capaUrl')}
        />
      </Field>

      {error && !(error instanceof ApiError && Object.keys(error.campos).length > 0) && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? 'Salvando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
