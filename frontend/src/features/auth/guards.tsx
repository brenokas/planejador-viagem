import { Navigate, Outlet, useLocation } from 'react-router'
import { useMe } from './api'
import { useRedirectTarget } from './redirect'

export function RequireAuth() {
  const { data: user, isPending } = useMe()
  const location = useLocation()

  if (isPending) return <FullScreenLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function GuestOnly() {
  const { data: user, isPending } = useMe()
  const target = useRedirectTarget()
  if (isPending) return <FullScreenLoading />
  if (user) return <Navigate to={target} replace />
  return <Outlet />
}

function FullScreenLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-slate-500">Carregando…</div>
  )
}
