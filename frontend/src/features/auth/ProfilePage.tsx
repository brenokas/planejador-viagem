import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { applyServerErrors } from '@/lib/form'
import { useChangePassword, useLogout, useMe, useUpdateProfile, type User } from './api'

export function ProfilePage() {
  const { data: me } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  if (!me) return null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Avatar id={me.id} nome={me.nome} className="size-14 text-lg ring-0" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{me.nome}</h1>
          <p className="truncate text-sm text-slate-500">{me.email}</p>
        </div>
      </div>

      <NameForm key={me.nome} me={me} />
      <PasswordForm />

      <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold">Usar como app no celular</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          <li>
            <strong className="font-medium text-slate-800">Android (Chrome):</strong> menu ⋮ → Adicionar à tela inicial.
          </li>
          <li>
            <strong className="font-medium text-slate-800">iPhone (Safari):</strong> Compartilhar → Adicionar à Tela de
            Início.
          </li>
        </ul>
        <p className="mt-2 text-sm text-slate-500">Funciona quando o celular está no mesmo Wi-Fi que o computador.</p>
      </section>

      <Button
        variant="outline"
        className="w-full text-red-600"
        disabled={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })}
      >
        <LogOut className="size-4" />
        Sair
      </Button>
    </div>
  )
}

const nameSchema = z.object({ nome: z.string().trim().min(1, 'Informe seu nome.').max(100, 'Nome muito longo.') })

function NameForm({ me }: { me: User }) {
  const update = useUpdateProfile()
  const [salvo, setSalvo] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema), defaultValues: { nome: me.nome } })

  const submit = handleSubmit(({ nome }) =>
    update.mutate(nome, {
      onSuccess: () => setSalvo(true),
      onError: (e) => applyServerErrors(e, setError),
    }),
  )

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-slate-200" noValidate>
      <h2 className="font-semibold">Seus dados</h2>
      <Field label="Nome" htmlFor="nome" error={errors.nome?.message}>
        <Input id="nome" autoComplete="name" aria-invalid={!!errors.nome} {...register('nome')} />
      </Field>
      <Field label="E-mail" htmlFor="email">
        <Input id="email" value={me.email} readOnly disabled className="bg-slate-50 text-slate-500" />
      </Field>
      {update.error && <p className="text-sm text-red-600">{update.error.message}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!isDirty || update.isPending}>
          {update.isPending ? 'Salvando…' : 'Salvar nome'}
        </Button>
        {salvo && !isDirty && <span className="text-sm text-emerald-700">Nome atualizado.</span>}
      </div>
    </form>
  )
}

const passwordSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual.'),
    novaSenha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(72, 'Senha muito longa.'),
    confirmacao: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmacao, { path: ['confirmacao'], message: 'As senhas não conferem.' })

function PasswordForm() {
  const change = useChangePassword()
  const [ok, setOk] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) })

  const submit = handleSubmit(({ senhaAtual, novaSenha }) => {
    setOk(false)
    change.mutate(
      { senhaAtual, novaSenha },
      {
        onSuccess: () => {
          reset({ senhaAtual: '', novaSenha: '', confirmacao: '' })
          setOk(true)
        },
        onError: (e) => applyServerErrors(e, setError),
      },
    )
  })

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-slate-200" noValidate>
      <h2 className="font-semibold">Trocar senha</h2>
      <Field label="Senha atual" htmlFor="senhaAtual" error={errors.senhaAtual?.message}>
        <Input
          id="senhaAtual"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.senhaAtual}
          {...register('senhaAtual')}
        />
      </Field>
      <Field label="Nova senha" htmlFor="novaSenha" error={errors.novaSenha?.message}>
        <Input
          id="novaSenha"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.novaSenha}
          {...register('novaSenha')}
        />
      </Field>
      <Field label="Confirmar nova senha" htmlFor="confirmacao" error={errors.confirmacao?.message}>
        <Input
          id="confirmacao"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmacao}
          {...register('confirmacao')}
        />
      </Field>
      {change.error && Object.keys(errors).length === 0 && <p className="text-sm text-red-600">{change.error.message}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? 'Salvando…' : 'Trocar senha'}
        </Button>
        {ok && <span className="text-sm text-emerald-700">Senha alterada.</span>}
      </div>
    </form>
  )
}
