import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-class'

/** Arquivo de uma tela que não existe mais: acontece quando o app foi atualizado com a página aberta. */
function isStaleChunk(error: unknown) {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(error.message)
  )
}

export function RouteError() {
  const error = useRouteError()
  const versaoNova = isStaleChunk(error)
  const naoEncontrada = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-sm flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">
        {versaoNova ? 'O app foi atualizado' : naoEncontrada ? 'Página não encontrada' : 'Algo deu errado'}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {versaoNova
          ? 'Recarregue para usar a versão nova.'
          : naoEncontrada
            ? 'O endereço pode estar errado ou a página foi removida.'
            : 'Tente recarregar. Se continuar, volte para as viagens.'}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => window.location.reload()}>Recarregar</Button>
        {!versaoNova && (
          <Link to="/" className={buttonClass('outline')}>
            Minhas viagens
          </Link>
        )}
      </div>
    </div>
  )
}
