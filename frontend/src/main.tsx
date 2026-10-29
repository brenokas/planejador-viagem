import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AppLayout } from '@/components/AppLayout'
import { RouteError } from '@/components/RouteError'
import { ConfirmProvider } from '@/components/ui/confirm'
import { GuestOnly, RequireAuth } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ApiError } from '@/lib/api'
import './index.css'

/** Sessão expirada em qualquer chamada: limpa o usuário e as guardas de rota levam ao login. */
function onApiError(error: Error) {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(['me'], null)
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onApiError }),
  mutationCache: new MutationCache({ onError: onApiError }),
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 30_000 },
  },
})

// Cada tela vira um arquivo separado, carregado só quando é aberta.
const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <div className="flex min-h-dvh items-center justify-center text-slate-500">Carregando…</div>,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/cadastro', element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/convite/:token',
            lazy: () => import('@/features/trips/InvitePage').then((m) => ({ Component: m.InvitePage })),
          },
          {
            element: <AppLayout />,
            errorElement: <RouteError />,
            children: [
              {
                path: '/',
                lazy: () => import('@/features/trips/TripsPage').then((m) => ({ Component: m.TripsPage })),
              },
              {
                path: '/viagens/nova',
                lazy: () => import('@/features/trips/TripFormPages').then((m) => ({ Component: m.NewTripPage })),
              },
              {
                path: '/perfil',
                lazy: () => import('@/features/auth/ProfilePage').then((m) => ({ Component: m.ProfilePage })),
              },
              {
                path: '/viagens/:id',
                lazy: () => import('@/features/realtime/TripRealtime').then((m) => ({ Component: m.TripRealtime })),
                children: [
                  {
                    index: true,
                    lazy: () => import('@/features/trips/TripDetailPage').then((m) => ({ Component: m.TripDetailPage })),
                  },
                  {
                    path: 'editar',
                    lazy: () => import('@/features/trips/TripFormPages').then((m) => ({ Component: m.EditTripPage })),
                  },
                  {
                    path: 'roteiro',
                    lazy: () =>
                      import('@/features/itinerary/ItineraryPage').then((m) => ({ Component: m.ItineraryPage })),
                  },
                  {
                    path: 'orcamento',
                    lazy: () => import('@/features/expenses/ExpensesPage').then((m) => ({ Component: m.ExpensesPage })),
                  },
                  {
                    path: 'checklist',
                    lazy: () =>
                      import('@/features/checklist/ChecklistPage').then((m) => ({ Component: m.ChecklistPage })),
                  },
                  {
                    path: 'assistente',
                    lazy: () => import('@/features/ai/AssistantPage').then((m) => ({ Component: m.AssistantPage })),
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <RouterProvider router={router} />
      </ConfirmProvider>
    </QueryClientProvider>
  </StrictMode>,
)
