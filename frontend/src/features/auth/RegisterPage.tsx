import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { applyServerErrors } from '@/lib/form'
import { useRegister } from './api'
import { AuthLayout } from './AuthLayout'
import { useRedirectTarget } from './redirect'

const schema = z
  .object({
    nome: z.string().trim().min(1, 'Informe seu nome.').max(100, 'Nome muito longo.'),
    email: z.email('E-mail inválido.'),
    senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(72, 'Senha muito longa.'),
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não conferem.',
  })

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const registerUser = useRegister()
  const navigate = useNavigate()
  const target = useRedirectTarget()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(({ nome, email, senha }) =>
    registerUser.mutate(
      { nome, email, senha },
      {
        onSuccess: () => navigate(target, { replace: true }),
        onError: (e) => applyServerErrors(e, setError),
      },
    ),
  )

  return (
    <AuthLayout title="Criar conta">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Nome" htmlFor="nome" error={errors.nome?.message}>
          <Input id="nome" autoComplete="name" aria-invalid={!!errors.nome} {...register('nome')} />
        </Field>
        <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Senha" htmlFor="senha" error={errors.senha?.message}>
          <Input
            id="senha"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.senha}
            {...register('senha')}
          />
        </Field>
        <Field label="Confirmar senha" htmlFor="confirmacao" error={errors.confirmacao?.message}>
          <Input
            id="confirmacao"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmacao}
            {...register('confirmacao')}
          />
        </Field>

        {registerUser.error && <p className="text-sm text-red-600">{registerUser.error.message}</p>}

        <Button type="submit" className="w-full" disabled={registerUser.isPending}>
          {registerUser.isPending ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link to="/login" state={{ from: target }} className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
