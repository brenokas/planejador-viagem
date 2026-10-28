import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { applyServerErrors } from '@/lib/form'
import { useLogin } from './api'
import { AuthLayout } from './AuthLayout'
import { useRedirectTarget } from './redirect'

const schema = z.object({
  email: z.email('E-mail inválido.'),
  senha: z.string().min(1, 'Informe sua senha.'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const login = useLogin()
  const navigate = useNavigate()
  const target = useRedirectTarget()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit((data) =>
    login.mutate(data, {
      onSuccess: () => navigate(target, { replace: true }),
      onError: (e) => applyServerErrors(e, setError),
    }),
  )

  return (
    <AuthLayout title="Entrar">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Senha" htmlFor="senha" error={errors.senha?.message}>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.senha}
            {...register('senha')}
          />
        </Field>

        {login.error && <p className="text-sm text-red-600">{login.error.message}</p>}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" state={{ from: target }} className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
