import { LogOut, Plane, User } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useLogout, useMe } from '@/features/auth/api'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }> }

const navItems: NavItem[] = [
  { to: '/', label: 'Viagens', icon: Plane },
  { to: '/perfil', label: 'Perfil', icon: User },
]

export function AppLayout() {
  const { data: user } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  const handleLogout = () => logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="font-semibold text-primary">Planejador de Viagem</span>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100',
                    isActive && 'text-primary',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-600 sm:inline">Olá, {user?.nome.split(' ')[0]}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 text-xs text-slate-500',
                  isActive && 'text-primary',
                )
              }
            >
              <Icon className="size-6" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
