import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Trip } from '@/features/trips/api'
import { ApiError } from '@/lib/api'
import { centsToInput, parseMoney } from '@/lib/format'
import { applyServerErrors } from '@/lib/form'
import { useDeleteActivity, useSaveActivity, type Activity, type Category } from './api'
import { CATEGORIA_ORDEM, CATEGORIAS } from './categories'
import { formatDay, formatTime } from './days'
import { PlaceSearch } from './PlaceSearch'

const IDEIAS = ''

const schema = z
  .object({
    titulo: z.string().trim().min(1, 'Informe um título.').max(150, 'Título muito longo.'),
    data: z.string(),
    horaInicio: z.string(),
    horaFim: z.string(),
    categoria: z.enum(CATEGORIA_ORDEM as [Category, ...Category[]]),
    local: z.object({ localNome: z.string().max(300), lat: z.number().nullable(), lng: z.number().nullable() }),
    custo: z
      .string()
      .refine((v) => !Number.isNaN(parseMoney(v)), 'Valor inválido.')
      .refine((v) => (parseMoney(v) ?? 0) >= 0, 'O custo não pode ser negativo.'),
    notas: z.string().max(5000, 'Notas muito longas.'),
  })
  .refine((d) => !d.horaInicio || !d.horaFim || d.horaFim >= d.horaInicio, {
    path: ['horaFim'],
    message: 'O término deve ser depois do início.',
  })

type FormData = z.infer<typeof schema>

export type ActivityDialogState = { activity?: Activity; data?: string | null } | null

export function ActivityDialog({
  trip,
  datas,
  state,
  onClose,
}: {
  trip: Trip
  datas: string[]
  state: ActivityDialogState
  onClose: () => void
}) {
  return (
    <Dialog open={state != null} onClose={onClose} title={state?.activity ? 'Editar atividade' : 'Nova atividade'}>
      {state && (
        <ActivityForm
          key={state.activity ? `${state.activity.id}-${state.activity.version}` : `nova-${state.data}`}
          trip={trip}
          datas={datas}
          activity={state.activity}
          dataInicial={state.data ?? null}
          onDone={onClose}
        />
      )}
    </Dialog>
  )
}

function ActivityForm({
  trip,
  datas,
  activity,
  dataInicial,
  onDone,
}: {
  trip: Trip
  datas: string[]
  activity?: Activity
  dataInicial: string | null
  onDone: () => void
}) {
  const save = useSaveActivity(trip.id)
  const remove = useDeleteActivity(trip.id)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: activity?.titulo ?? '',
      data: (activity ? activity.data : dataInicial) ?? IDEIAS,
      horaInicio: formatTime(activity?.horaInicio ?? null) ?? '',
      horaFim: formatTime(activity?.horaFim ?? null) ?? '',
      categoria: activity?.categoria ?? 'PASSEIO',
      local: {
        localNome: activity?.localNome ?? '',
        lat: activity?.lat ?? null,
        lng: activity?.lng ?? null,
      },
      custo: centsToInput(activity?.custoCentavos ?? null),
      notas: activity?.notas ?? '',
    },
  })

  // Uma atividade pode estar num dia que saiu do período da viagem; mantém a opção para não perdê-la.
  const opcoesDatas = activity?.data && !datas.includes(activity.data) ? [...datas, activity.data] : datas

  const submit = handleSubmit((d) =>
    save.mutate(
      {
        id: activity?.id,
        input: {
          titulo: d.titulo,
          data: d.data || null,
          horaInicio: d.horaInicio || null,
          horaFim: d.horaFim || null,
          categoria: d.categoria,
          localNome: d.local.localNome || null,
          lat: d.local.lat,
          lng: d.local.lng,
          custoCentavos: parseMoney(d.custo),
          notas: d.notas || null,
          version: activity?.version,
        },
      },
      { onSuccess: onDone, onError: (e) => applyServerErrors(e, setError) },
    ),
  )

  const handleDelete = () => {
    if (!activity || !window.confirm(`Excluir "${activity.titulo}"?`)) return
    remove.mutate(activity.id, { onSuccess: onDone })
  }

  const erroGeral = save.error && !(save.error instanceof ApiError && Object.keys(save.error.campos).length > 0)

  return (
    <form onSubmit={submit} className="max-h-[70dvh] space-y-4 overflow-y-auto px-0.5 pb-1" noValidate>
      <Field label="O que vão fazer?" htmlFor="titulo" error={errors.titulo?.message}>
        <Input id="titulo" placeholder="Ex.: Visitar o Coliseu" aria-invalid={!!errors.titulo} {...register('titulo')} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dia" htmlFor="data" error={errors.data?.message}>
          <Select id="data" {...register('data')}>
            {opcoesDatas.map((d, i) => (
              <option key={d} value={d}>
                {i < datas.length ? `Dia ${i + 1} · ${formatDay(d)}` : `${formatDay(d)} (fora da viagem)`}
              </option>
            ))}
            <option value={IDEIAS}>Ideias (sem dia)</option>
          </Select>
        </Field>
        <Field label="Categoria" htmlFor="categoria">
          <Select id="categoria" {...register('categoria')}>
            {CATEGORIA_ORDEM.map((c) => (
              <option key={c} value={c}>
                {CATEGORIAS[c].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Início" htmlFor="horaInicio" error={errors.horaInicio?.message}>
          <Input id="horaInicio" type="time" {...register('horaInicio')} />
        </Field>
        <Field label="Término" htmlFor="horaFim" error={errors.horaFim?.message}>
          <Input id="horaFim" type="time" aria-invalid={!!errors.horaFim} {...register('horaFim')} />
        </Field>
      </div>

      <Field label="Local" htmlFor="local" error={errors.local?.localNome?.message}>
        <Controller
          control={control}
          name="local"
          render={({ field }) => (
            <PlaceSearch id="local" value={field.value} destino={trip.destino} onChange={field.onChange} />
          )}
        />
      </Field>

      <Field label={`Custo estimado (${trip.moeda})`} htmlFor="custo" error={errors.custo?.message}>
        <Input id="custo" inputMode="decimal" placeholder="0,00" aria-invalid={!!errors.custo} {...register('custo')} />
      </Field>

      <Field label="Notas" htmlFor="notas" error={errors.notas?.message}>
        <Textarea id="notas" placeholder="Reserva, horários, dicas…" {...register('notas')} />
      </Field>

      {erroGeral && <p className="text-sm text-red-600">{save.error.message}</p>}
      {remove.error && <p className="text-sm text-red-600">{remove.error.message}</p>}

      <div className="flex gap-3 pt-2">
        {activity && (
          <Button type="button" variant="outline" className="text-red-600" onClick={handleDelete} aria-label="Excluir">
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={save.isPending}>
          {save.isPending ? 'Salvando…' : activity ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
