import { ChevronLeft, Plane, User } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink, Outlet, useMatch } from 'react-router'
import { Avatar } from '@/components/ui/avatar'
import { useMe } from '@/features/auth/api'
import { useTrip } from '@/features/trips/api'
import { TRIP_TABS, tripTabUrl } from '@/features/trips/tabs'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }>; end?: boolean }

const navItems: NavItem[] = [
  { to: '/', label: 'Viagens', icon: Plane, end: true },
  { to: '/perfil', label: 'Perfil', icon: User, end: true },
]

/** Id da viagem aberta (em /viagens/:id/...), ou null fora de uma viagem. */
function useTripIdFromUrl() {
  const match = useMatch('/viagens/:id/*')
  const id = Number(match?.params.id)
  return Number.isFinite(id) ? id : null
}

export function AppLayout() {
  const { data: user } = useMe()
  const tripId = useTripIdFromUrl()

  // Dentro de uma viagem, a barra inferior vira as abas da viagem: trocar de parte é um toque só.
  const bottomItems: NavItem[] =
    tripId != null
      ? TRIP_TABS.map((t) => ({ to: tripTabUrl(tripId, t), label: t.label, icon: t.icon, end: true }))
      : navItems

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50 pt-[env(safe-area-inset-top)]">
        <div className="airmail h-1" aria-hidden />
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          {tripId != null ? (
            <>
              <TripBackLink tripId={tripId} className="md:hidden" />
              <Logo className="hidden md:flex" />
            </>
          ) : (
            <Logo />
          )}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'label-mono rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    isActive && 'text-tomato-ink underline decoration-2 underline-offset-8',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {user && (
            <NavLink
              to="/perfil"
              className="flex shrink-0 items-center gap-2 rounded-full py-1 pr-1 pl-3 text-sm text-slate-600 hover:bg-slate-100"
              aria-label="Seu perfil"
            >
              <span className="hidden sm:inline">{user.nome.split(' ')[0]}</span>
              <Avatar id={user.id} nome={user.nome} className="size-8 ring-0" />
            </NavLink>
          )}
        </div>
        {tripId != null && <TripTabsBar tripId={tripId} />}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:pb-10">
        <Outlet />
      </main>

      <nav
        aria-label={tripId != null ? 'Partes da viagem' : 'Navegação principal'}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-slate-50 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${bottomItems.length}, minmax(0, 1fr))` }}>
          {bottomItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex min-w-0 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium text-slate-500',
                  isActive && 'font-semibold text-tomato-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                      isActive && 'bg-tomato/12',
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="max-w-full truncate px-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function Logo({ className }: { className?: string }) {
  return (
    <NavLink to="/" className={cn('flex items-baseline gap-2 text-slate-900', className)}>
      <span className="font-display text-xl font-semibold italic" style={{ fontVariationSettings: "'SOFT' 100" }}>
        Planejador
      </span>
      <span className="label-mono text-[10px] text-tomato-ink">de viagem</span>
    </NavLink>
  )
}

function TripBackLink({ tripId, className }: { tripId: number; className?: string }) {
  const { data: trip } = useTrip(tripId)
  return (
    <NavLink
      to="/"
      className={cn('-ml-2 flex min-w-0 items-center gap-1 rounded-lg py-1.5 pr-2 pl-1 hover:bg-slate-100', className)}
      aria-label="Voltar para as viagens"
    >
      <ChevronLeft className="size-5 shrink-0 text-slate-500" />
      <span className="truncate font-display text-lg font-semibold italic">{trip?.titulo ?? 'Viagens'}</span>
    </NavLink>
  )
}

/** Abas da viagem no desktop, numa segunda linha do cabeçalho. */
function TripTabsBar({ tripId }: { tripId: number }) {
  const { data: trip } = useTrip(tripId)
  return (
    <div className="hidden border-t border-slate-200 md:block">
      <div className="mx-auto flex h-12 max-w-5xl items-center gap-6 px-4">
        <p className="max-w-56 truncate font-display text-lg font-semibold italic">{trip?.titulo}</p>
        <nav aria-label="Partes da viagem" className="-mb-px flex h-full items-stretch gap-1">
          {TRIP_TABS.map((t) => (
            <NavLink
              key={t.path}
              to={tripTabUrl(tripId, t)}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-slate-500 hover:text-slate-900',
                  isActive && 'border-tomato text-slate-900',
                )
              }
            >
              <t.icon className="size-4" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
